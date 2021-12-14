import xrpl

client = xrpl.clients.JsonRpcClient("https://s1.ripple.com:51234/")
# TODO: requires xrpl-py to export autofill, not available in a proper release yet.
