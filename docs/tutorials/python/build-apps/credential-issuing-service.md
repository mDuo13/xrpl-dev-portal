---
seo:
    description: Build a credential issuing microservice in Python.
---
# Build a Credential Issuing Service
_(Requires the Credentials amendment. {% not-enabled %})_

This tutorial demonstrates how to build and use a microservice that issues <!-- TODO: link [Credentials](../../../concepts/decentralized-storage/credentials.md) --> Credentials on the XRP Ledger, in the form of a RESTlike API, using the [Flask](https://flask.palletsprojects.com/) framework for Python.

## Setup

First, download the complete sample code for this tutorial from GitHub:

- {% repo-link path="_code-samples/issue-credentials/py/" %}Credential Issuing Service sample code{% /repo-link %}

Then, in the appropriate directory, set up a virtual environment and install dependencies:

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

This should install appropriate versions of Flask and xrpl-py.

To use the API that this microservice provides, you also need an HTTP client such as [Postman](https://www.postman.com/downloads/), [RESTED](https://github.com/RESTEDClient/RESTED), or [cURL](https://curl.se/).


## Overview

The Credential Issuer microservice, mostly implemented in `issuer_service.py`, provides a RESTlike API with the following methods:

| Method | Description |
|---|----|
| `POST /credential` | Request that the issuer issue a specific credential to a specific account. |
| `GET /admin/credential` | List all credentials issued by the issuer's address, optionally filtering only for credentials that have or have not been accepted by their subject. |
| `DELETE /admin/credential` | Delete a specific credential from the XRP Ledger, which revokes it. |

{% admonition type="info" name="Note" %}Some of the methods have `/admin` in the path because they are intended to be used by the microservice's administrator. However, the sample code does not implement any authentication.{% /admonition %}

The sample code also contains a simple commmandline interface for a user account to accept a credential issued to it, as `accept_credential.py`.

The other files contain helper code that is used by one or both tools.


## Usage

### 1. Get Accounts

To use the credential issuing service, you need two accounts on the Devnet, where the Credentials amendment is already enabled. Go to the [XRP Faucets page](../../../../resources/dev-tools/xrp-faucets) and select **Devnet**. Then, click the button to Generate credentials, saving the key pair (address and secret), twice. You will use one of these accounts as a **credential issuer** and the other account as the **credential subject** (holder), so make a note of which is which.

## 2. Start Issuer Service

To start the issuer microservice in dev mode, run the following command from the directory with the sample code:

```sh
flask --app issuer_service run
```

It should prompt you for your **issuer account** seed. Input the secret key you saved previously and press Enter.

The output should look like the following:

```txt
Issuer account seed: 
Starting credential issuer with XRPL address rJ6XzCCSapCaWZxExArkcBWLgJvT6bXCbV
 * Serving Flask app 'issuer_service'
 * Debug mode: off
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

Double-check that the XRPL address displayed matches the address of the credential issuer keys you saved earlier.

## 3. Request Credential

To request a credential, make a request such as the following:

{% tabs %}
{% tab name="Summary" %}
* HTTP method: `POST`
* URL: `http://localhost:5000/credential`
* Headers:
    * `Content-Type: application/json`
* Request Body:
    ```json
    {
        "subject": "rGtnKx7veDhV9CgYenkiCV5HMLpgU2BfcQ",
        "credential": "TestCredential",
        "documents": {
            "reason": "please"
        }
    }
    ```
{% /tab %}
{% /tabs %}

The parameters of the JSON request body should be as follows:

| Field | Type | Required? | Description |
|---|---|---|---|
| `subject` | String - Address | Yes | The XRPL classic address of the subject of the credential. Set this to the address that you generated at the start of this tutorial for the credential holder account. |
| `credential` | String | Yes | The type of credential to issue. The example microservice accepts any string consisting of alphanumeric characters as well as the special characters underscore (`_`), dash (`-`), and period (`.`), with a minimum length of 1 and a maximum length of 64 characters. |
| `documents` | Any | Yes | For a real service, the issuer could require the user to submit specific data in this field that proves that they deserve the credential. The sample code only checks that this field is present and doesn't evaluate to false. |
| `expiration` | String - ISO8601 Datetime | No | The time after which the credential expires, such as `2025-12-31T00:00:00Z`. |
| `uri` | String | No | Optional URI data to store with the credential. If provided, this must be a string with minimum length 1 and max length 256, consisting of only characters that are valid in URIs, which are numbers, letters, and the following special characters: `-._~:/?#[]@!$&'()*+,;=%`. |

This microservice immediately issues any credential that the user requests. A successful response from the API uses the HTTP status code `201 Created` and has a response body with the result of submitting the transaction to the XRP Ledger. You can use the `hash` or `ctid` value from the response to look up the transaction using an explorer such as [https://devnet.xrpl.org/](https://devnet.xrpl.org/).

{% admonition type="success" name="Tip: Differences from Production" %}For a real credential issuer, you would probably only issue specific types of credentials, rather than any credential. Instead of immediately issuing credentials, you might want to store credential requests, to give yourself time to examine the user's documents and decide whether to issue the credential, then use a different admin-only method to actually issue the credential after doing so.{% /admonition %}

## 4. List Credentials

To show a list of credentials issued by the issuing account, make the following request:

{% tabs %}
{% tab name="Summary" %}
* HTTP method: `GET`
* URL: `http://localhost:5000/admin/credential`
{% /tab %}
{% /tabs %}

A response could look like the following:

```json
{
  "credentials": [
    {
      "accepted": false,
      "credential": "TestCredential",
      "subject": "rGtnKx7veDhV9CgYenkiCV5HMLpgU2BfcQ"
    }
  ]
}
```

In the response, each entry in the `credentials` array represents a Credential issued by the issuer account and stored in the blockchain. The details should match the request from the previous step, except that the `documents` are omitted because they are not saved on the blockchain.

## 5. Accept Credential

For a credential to be valid, the subject of the credential has to accept it. You can use `accept_credential.py` to do this:

```sh
python accept_credential.py
```

It should prompt you for your **subject account** seed. Input the secret key you saved previously and press Enter.

The script displays a list of Credentials that have been issued to your account and have not been accepted yet. Input the number that corresponds to the credential you want to accept, then press Enter. For example:

```txt
Accept a credential?
    0) No, quit.
    1) 'TestCredential' issued by rJ6XzCCSapCaWZxExArkcBWLgJvT6bXCbV
    2) 'AnotherTestCredential' issued by rJ6XzCCSapCaWZxExArkcBWLgJvT6bXCbV
Select an option (0-2): 1
```

The script signs and submits a transaction to accept the specified credential, and prints the output to the console. You can use the `hash` or `ctid` value to look up the transaction using an explorer.

## 6. Revoke Credential

To revoke an issued credential, make a request such as the following:

{% tabs %}
{% tab name="Summary" %}
* HTTP method: `DELETE`
* URL: `http://localhost:5000/admin/credential`
* Headers:
    * `Content-Type: application/json`
* Request Body:
    ```json
    {
        "subject": "rGtnKx7veDhV9CgYenkiCV5HMLpgU2BfcQ",
        "credential": "TestCredential"
    }
    ```
{% /tab %}
{% /tabs %}

The parameters of the JSON request body should be as follows:

| Field | Type | Required? | Description |
|---|---|---|---|
| `subject` | String - Address | Yes | The XRPL classic address of the subject of the credential to revoke. |
| `credential` | String | Yes | The type of credential to revoke. This must match a credential type previously issued. |

A successful response from the API uses the HTTP status code `200 OK` and has a response body with the result of submitting the transaction to the XRP Ledger. You can use the `hash` or `ctid` value from the response to look up the transaction using an explorer.

## Code Walkthrough

The code for this tutorial is divided among the following files:

| File | Purpose |
|---|---|
| `accept_credential.py` | Commandline interface for a credential subject to look up and accept Credentials. |
| `credential_mode.py` | A model class for Credentials that validates user input, and maps between the microservice's simplified Credential format and the full XRPL representation of Credentials. |
| `decode_hex.py` | A helper function for decoding hexadecimal into human-readable strings, used by both the credential issuer and holder. |
| `issuer_service.py` | Defines the microservice as a Flask app, including API methods and error handling. |
| `look_up_credentials.py` | A helper function for looking up Credentials tied to an account, including pagination and filtering, used by both the credential issuer and holder. |

### accept_credential.py

This file is meant to be run as a commandline tool so it starts with a [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)), followed by dependencies grouped by type: standard lib, then PyPI packages, and local files last:

{% code-snippet file="/_code-samples/issue-credentials/py/accept_credential.py" language="py" before="XRPL_SERVER =" /%}

It then defines the XRPL client and sets up a `Wallet` instance with the subject account's key pair, using a seed either passed as an environment variable or input as a password:

{% code-snippet file="/_code-samples/issue-credentials/py/accept_credential.py" language="py" from="XRPL_SERVER =" before="pending_credentials = " /%}

It looks up pending credentials using the `look_up_credentials(...)` function imported from `look_up_credentials.py`:

{% code-snippet file="/_code-samples/issue-credentials/py/accept_credential.py" language="py" from="pending_credentials = " before="prompt = " /%}

Next is a text menu that displays each of the unaccepted credentials returned by the lookup, as well as the option to quit:

{% code-snippet file="/_code-samples/issue-credentials/py/accept_credential.py" language="py" from="prompt = " before="chosen_cred = " /%}

Finally, if the user picked a credential, the code constructs a [CredentialAccept transaction][], signs and submits it, and waits for it to be validated by consensus before displaying the result.

{% code-snippet file="/_code-samples/issue-credentials/py/accept_credential.py" language="py" from="chosen_cred = " /%}

## issuer_service.py

This file defines the Flask app of the issuer microservice. It opens by importing dependencies, grouped into standard lib, PyPI dependencies, and lastly local files:

{% code-snippet file="/_code-samples/issue-credentials/py/issuer_service.py" language="py" before="# Set up" /%}

It then defines the XRPL client and sets up a `Wallet` instance with the account holder's key pair, using a seed either passed as an environment variable or input as a password:

{% code-snippet file="/_code-samples/issue-credentials/py/issuer_service.py" language="py" from="# Set up" before="# Define Flask app" /%}

Next, it creates the Flask app:

{% code-snippet file="/_code-samples/issue-credentials/py/issuer_service.py" language="py" from="# Define Flask app" before="# Method for users" /%}

After that come the definitions for the three API methods, starting with `POST /credential` which requests a credential from the service. This method parses the request body as JSON and instantiates a `CredentialRequest` object—one of the data models defined in `credential_model.py`. If this succeeds, it uses the data to fill out a CredentialCreate transaction. Finally, it checks the transaction's [result code](../../../references/protocol/transactions/transaction-results/index.md) to decide which HTTP response code to use:

{% code-snippet file="/_code-samples/issue-credentials/py/issuer_service.py" language="py" from="# Method for users to request a credential from the service" before="# Method for admins to look up all credentials issued" /%}

The next API method is `GET /admin/credential`, which looks up credentials issued by the service. It uses the `look_up_credentials(...)` method defined in `look_up_credentials.py` to get a list of credentials. It uses the `Credential` data model, imported from `credential_model.py`, to transform each ledger entry from the XRP Ledger format to the simplified representation the microservice uses.

{% code-snippet file="/_code-samples/issue-credentials/py/issuer_service.py" language="py" from="# Method for admins to look up all credentials issued" before="# Method for admins to revoke an issued credential" /%}

The final API method, `DELETE /admin/credential`, deletes a Credential from the ledger, revoking it. This again uses the `Credential` data model to validate user inputs and translate them into XRPL format where necessary. After that, it _could_ go straight to sending a CredentialDelete transaction, but first it attempts to look up the Credential in the ledger and returns an error if it doesn't exist. This way, the issuer doesn't have to pay the cost of sending a transaction that's doomed to fail. Finally, the method checks the transaction result code and sets the HTTP response code accordingly.

{% code-snippet file="/_code-samples/issue-credentials/py/issuer_service.py" language="py" from="# Method for admins to revoke an issued credential" before="# Error handling" /%}

Finally, the file ends by adding error handlers for a variety of errors that can be raised by the API methods, including in the data models or by xrpl-py's API methods:

{% code-snippet file="/_code-samples/issue-credentials/py/issuer_service.py" language="py" from="# Error handling" /%}
