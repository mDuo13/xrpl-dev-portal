import os
import re
from getpass import getpass
from binascii import hexlify, unhexlify
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from werkzeug.exceptions import BadRequest

from xrpl.clients import JsonRpcClient
from xrpl.core.addresscodec import is_valid_classic_address
from xrpl.models.exceptions import XRPLModelException
from xrpl.models.requests import AccountObjects, AccountObjectType
from xrpl.models.transactions import CredentialCreate, CredentialDelete
from xrpl.transaction import sign_and_submit
from xrpl.utils import ripple_time_to_datetime, str_to_hex
from xrpl.wallet import Wallet


# XRPL credential types can be any arbitrary data, but because this service 
# encodes from ASCII, it only accepts these characters in credential types:
# alphanumeric characters, underscore, period, and dash (min length 1)
CREDENTIAL_REGEX = re.compile(r'^[A-Za-z0-9_\.\-]+$')

# The URI field on XRPL can be arbitrary data, but because this service
# encodes from ASCII, it only accepts these characters in URIs:
# alphanumeric and the following symbols: -._~:/?#[]@!$&'()*+,;=%
URI_REGEX = re.compile(r"[A-Za-z0-9\-\._~:/\?#\[\]@!$&'\(\)\*\+,;=%]+")

lsfAccepted = 0x00010000


def init_wallet():
    # seed = os.getenv("ISSUER_ACCOUNT_SEED")
    seed = getpass(prompt='Issuer account seed: ',stream=None)
    if not seed:
        print("Please specify the issuer's master seed")
        exit(1)
    return Wallet.from_seed(seed=seed)

wallet = init_wallet()
print("Starting credential issuer with XRPL address", wallet.address)

client = JsonRpcClient("https://s.devnet.rippletest.net:51234/")

app = Flask(__name__)

def isoformat(ripple_time: int):
    """Returns a string in ISO 8601 date-time format"""
    return ripple_time_to_datetime(ripple_time).isoformat(tzinfo=timezone.utc)

class Credential:
    """
    A credential object, in a simplified format for our API.
    The constructor performs parameter validation. Attributes:
    subject (str): the subject of the credential, as a classic address
    credential (str): the credential type, in human-readable (ASCII) chars
    uri (str, optional): the URI of the credential, in human-readable (ASCII) chars
    expiration (datetime, optional): the time when the credential expires, in seconds
                                     (displayed as an ISO 8601 format string in JSON)
    accepted (bool, optional): true if this represents a credential that has been accepted
                               on the XRPL by the subject account. False if it represents
                               a credential that has been issued but not accepted. Omitted
                               for credentials that haven't been issued yet.
    """
    def __init__(self, d: dict):
        self.subject = d.get("account")
        if type(self.subject) != str or not is_valid_classic_address(self.subject):
            raise ValueError(f"subject account isn't valid: {self.subject}")

        self.credential = d.get("credential")
        if type(self.credential) != str or not CREDENTIAL_REGEX.match(self.credential):
            raise ValueError(f"credential isn't valid: {self.credential}")

        self.uri = d.get("uri")
        if self.uri is not None and (type(self.uri) != str or not URI_REGEX.match(self.uri)):
            raise ValueError(f"URI isn't valid: {self.uri}")

        exp = d.get("expiration")
        if exp:
            if type(exp) == str:
                self.expiration = datetime.fromisoformat(exp)
            elif type(exp) == datetime:
                self.expiration = exp
            else:
                raise ValueError(f"Unsupported expiration time format: {type(exp)}")
        else:
            self.expiration = None
        
        self.accepted = d.get("accepted")
    
    def to_dict(self):
        d = {
            "account": self.subject,
            "credential": self.credential,
        }
        if self.expiration is not None:
            d["expiration"] = expiration.isoformat(tzinfo=timezone.utc)
        if self.uri:
            d["uri"] = self.uri
        if self.accepted is not None:
            d["accepted"] = self.accepted
        return d
    
    @classmethod
    def from_xrpl(cls, xrpl_d: dict):
        """
        Instantiate from a Credential ledger entry in the XRPL format.
        """
        d = {
            "account": xrpl_d["Subject"],
            "credential": unhexlify(xrpl_d["CredentialType"]).decode("ascii"),
            "accepted": xrpl_d["Flags"] & lsfAccepted
        }
        if xrpl_d.get("URI"):
            d["uri"] = unhexlify(xrpl_d["CredentialType"]).decode("ascii")
        if xrpl_d.get("Expiration"):
            d["expiration"] = ripple_time_to_datetime(xrpl_d["Expiration"])
        return cls(d)
        

class CredentialRequest(Credential):
    """
    Request from user to issue a credential on ledger.
    The constructor performs parameter validation.
    """
    def __init__(self, cred_request):
        super().__init__(cred_request)

        self.documents = cred_request.get("documents")
        if not self.documents or not hasattr(self.documents, "get") or not self.documents.get("reason"):
            raise ValueError(f"documents field must be provided with a 'reason' field")


class XRPLError(Exception):
    status_code = 400
    def __init__(self, xrpl_response):
        self.body = xrpl_response.result

@app.errorhandler(XRPLError)
def handle_xrpl_error(e):
    response = jsonify(e.body)
    response.status_code = 400
    return response

@app.errorhandler(ValueError)
def handle_value_error(e):
    response = jsonify({
        "error": "badRequest",
        "error_message": str(e)
    })
    response.status_code = 400
    return response
# Reuse the same handler for xrpl-py's model exceptions
app.register_error_handler(XRPLModelException, handle_value_error)

@app.route("/credential") #TODO: implement ?accepted=true|false parameter
def get_credentials():
    issued_credentials = []
    has_more_pages = True
    marker = None
    while has_more_pages:
        xrpl_response = client.request(AccountObjects(
            account=wallet.address,
            type=AccountObjectType.CREDENTIAL,
            marker=marker
        ))
        if xrpl_response.status != "success":
            raise XRPLError(xrpl_response)

        for obj in xrpl_response.result["account_objects"]:
            if obj["Issuer"] == wallet.address:
                # This is a credential we issued
                cred = Credential.from_xrpl(obj)
                issued_credentials.append(cred.to_dict())
        
        marker = xrpl_response.result.get("marker")
        if not marker:
            has_more_pages = False

    response = {
        "credentials": issued_credentials
    }
    return response

@app.route("/credential", methods=['POST'])
def request_credential():
    cred_request = CredentialRequest(request.json)

    cc_response = sign_and_submit(CredentialCreate(
        account=wallet.address,
        subject=cred_request.subject,
        credential_type=str_to_hex(cred_request.credential)
    ), client=client, wallet=wallet, autofill=True)

    # TODO: parse response and translate into a simpler API response
    return cc_response
    
@app.route("/credential", methods=['DELETE'])
def delete_credential():
    del_request = Credential(request.json)

    cd_response = sign_and_submit(CredentialDelete(
        account=wallet.address,
        subject=del_request.subject,
        credential_type=str_to_hex(del_request.credential)
    ), client=client, wallet=wallet, autofill=True)

    # TODO: parse response and translate into a simpler API response
    return cd_response
