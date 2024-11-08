import os
import re
from getpass import getpass
from datetime import timezone

from flask import Flask

from xrpl.clients import JsonRpcClient
from xrpl.core.addresscodec import is_valid_classic_address
from xrpl.models.requests import AccountObjects, AccountObjectType
from xrpl.models.transactions import CredentialCreate, CredentialDelete
from xrpl.transaction import sign_and_submit
from xrpl.utils import ripple_time_to_datetime
from xrpl.wallet import Wallet

# This service only accepts the following characters in credential types:
# alphanumeric characters, underscore, period, and dash (min length 1)
CREDENTIAL_REGEX = re.compile(r'^[A-Za-z0-9_\.\-]+$')
lsfAccepted = 0x00010000 #TODO: import from xrpl-py


def init_wallet():
    # seed = os.getenv("ISSUER_ACCOUNT_SEED")
    seed = getpass(prompt='Issuer account seed: ',stream=None)
    if not seed:
        print("Please specify the issuer's master seed")
        exit(1)
    return Wallet.from_seed(seed=seed)

wallet = init_wallet()
print("Starting credential issuer with XRPL address", wallet.address)

client = JsonRpcClient("https://s.altnet.rippletest.net:51234/")

app = Flask(__name__)

def isoformat(ripple_time: int):
    """Returns a string in ISO 8601 date-time format"""
    return ripple_time_to_datetime(ripple_time).isoformat(tzinfo=timezone.utc)

class CredentialRequest:
    """
    Request from user to issue a credential on ledger.
    The constructor performs parameter validation.
    """
    def __init__(self, cred_request):
        self.subject = cred_request.get("account")
        self.credential = cred_request.get("credential")
        self.documents = cred_request.get("documents")
        #TODO: handle expiration, URI?

        if type(self.subject) != str or not is_valid_classic_address(self.subject):
            raise ValueError(f"subject account isn't valid: {self.subject}")
            # TODO: check if account exists on-ledger. Here maybe?
        if type(self.credential) != str or not CREDENTIAL_REGEX.match(self.credential):
            raise ValueError(f"credential isn't valid: {self.credential}")
        if not documents or not hasattr(documents, "get") or not documents.get("reason"):
            raise ValueError(f"documents field must be provided with a 'reason' field")


class DelCredentialRequest:
    """
    Request from admin to delete/revoke an issued credential.
    The constructor performs parameter validation.
    """
    def __init__(self, del_request):
        self.subject = del_request.get("account")
        self.credential = del_request.get("credential")
        if type(self.subject) != str or not is_valid_classic_address(self.subject):
            raise ValueError(f"subject account isn't valid: {self.subject}")
        if type(self.credential) != str or not CREDENTIAL_REGEX.match(self.credential):
            raise ValueError(f"credential isn't valid: {self.credential}")
        # TODO: check if credential exists on-ledger. Here maybe?

@app.route("/credential") #TODO: implement ?accepted=true|false parameter
def get_credentials():
    issued_credentials = []
    # TODO: implement pagination here
    xrpl_response = client.request(AccountObjects(
        account=wallet.address,
        #type=AccountObjectType.CREDENTIAL
        type="credential",
    ))

    for obj in xrpl_response.result["account_objects"]:
        if obj["Issuer"] == wallet.address:
            # This is a credential we issued
            cred = {
                "account": obj["Subject"],
                "credential": obj["CredentialType"]
            }
            expired = False
            if obj.get("Expiration"):
                cred["expiration"] = isoformat(obj["Expiration"])
                # TODO: check if expiration is in the past based on
                # latest validated ledger close time
            if obj.get("Flags") & lsfAccepted:
                accepted = True
            else:
                accepted = False

            if expired:
                cred["status"] = "expired"
            elif accepted:
                cred["status"] = "valid"
            else:
                cred["status"] = "unaccepted"
            issued_credentials.append(cred)

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
        credential_type=cred_request.credential
    ), client=client, wallet=wallet, autofill=True)

    # TODO: parse response and translate into a simpler API response
    return cc_response
    
@app.route("/credential", methods=['DELETE'])
def delete_credential():
    del_request = DelCredentialRequest(request.json)

    cd_response = sign_and_submit(CredentialDelete(
        account=wallet.address,
        subject=del_request.subject,
        credential_type=del_request.credential
    ), client=client, wallet=wallet, autofill=True)

    # TODO: parse response and translate into a simpler API response
    return cd_response
