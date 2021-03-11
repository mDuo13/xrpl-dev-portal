{% if use_network is undefined or use_network == "Testnet" %}
  {% set ws_url = "wss://s.altnet.rippletest.net:51233" %}
{% elif use_network == "Devnet" %}
  {% set ws_url = "wss://s.devnet.rippletest.net:51233" %}
{% endif %}

{{ start_step("Connect") }}
<button id="connect-button" class="btn btn-primary" data-wsurl="{{ws_url}}">Connect to {{use_network}}</button>
<div>
  <strong>Connection status:</strong>
  <span id="connection-status">Not connected</span>
  <div class="loader" id="loader-connect" style="display: none;"><img class="throbber" src="assets/img/xrp-loader-96.png"></div>
</div>
{{ end_step() }}
