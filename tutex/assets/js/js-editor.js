// Interactive JavaScript editor code

let js_interactives = {};

function getvars(fnStr) {
  function _getvars(body) {
      if (!body) {
          return;
      }
      if (body.length) {
          for (var i = 0; i < body.length; i++) {
              _getvars(body[i]);
          }
      } else if ("VariableDeclaration" === body.type) {
          for (var i = 0; i < body.declarations.length; i++) {
              vars.push(body.declarations[i].id.name);
          }
      } else if (body.body) {
          _getvars(body.body);
      }
  }
  var vars = [];
  var syntax = esprima.parse(fnStr);
  _getvars(syntax.body);
  return vars;
}

var user_var_scope = {}

$(document).ready(()=> {
  $(".js_interactive").each((i, el) => {
    const wrapper = $(el);
    const interactive_id = wrapper.attr("id");

    const code_blocks = wrapper.find("pre code");
    const code_ex0 = code_blocks.eq(0); // First code block is the default
    const og_text = code_ex0.text().trim();

    // TODO: fix the copy-paste button
    const cm = CodeMirror(wrapper.find(".editor").get(0), {
      mode: 'javascript',
      json: false,
      smartIndent: false,
      gutters: ["CodeMirror-lint-markers"],
      lint: CodeMirror.lint.javascript
    });
    cm.setValue(og_text);
    code_ex0.parent().hide();

    wrapper.find(".reset-button").click((evt) => {
      cm.setValue(og_text);
      wrapper.find(".response").empty();
    });

    wrapper.find(".run-button").click((evt) => {
      // Wipe the results area and make a new response CodeMirror
      const resp = wrapper.find(".response");
      resp.empty().append("<p><strong>Output</strong></p>");
      // TODO: make "Response" translatable
      const cm_resp = CodeMirror(resp.get(0), {
        mode: 'javascript',
        json: false,
        readOnly: true,
        gutters: ["CodeMirror-lint-markers"]
      });

      // TODO: fix this code. As it stands, every time you run the code, it stacks another layer on top of console
      // which writes to the new output... on top of the old one that writes to the old previous console.

      const local_console = {
        log: (...args) => {
          console.log(...args);
          cm_resp.setValue(args.map(x => JSON.stringify(x, null, 2)).join(" "));
        },
        warn: (...args) => {
          console.warn(...args);
          cm_resp.setValue(args.map(x => JSON.stringify(x, null, 2)).join(" "));
        },
        error: (...args) => {
          console.error(...args);
          cm_resp.setValue(args.map((x) => {
            if (x instanceof Error) return x.toString();
            return JSON.stringify(x, null, 2);
          }).join(" "));
        }
      }
      let user_code = cm.getValue()
      // Figure out what vars to save from this run
      let user_vars
      try {
        user_vars = getvars(user_code)
      } catch(err) {
        console.warn("Esprima error getting vars:", err)
        user_vars = []
      }

      console.log("user_vars", user_vars)
      // Append code to save the new vars before user code is done running
      for (v of user_vars) {
        user_code += `\n\nuser_var_scope.${v} = ${v};\n`
      }
      console.log("edited user_code", user_code)

      // Add args based on the existing scope
      const user_var_names = []
      const user_var_vals = []
      for (v in user_var_scope)  {
        user_var_names.push(v)
        user_var_vals.push(user_var_scope[v])
      }
      try {
        const AsyncFunction = async function () {}.constructor;
        AsyncFunction("console", ...user_var_names, user_code)(local_console, ...user_var_vals);
        //eval(cm.getValue());
        console.log("user_var_scope", user_var_scope)
      } catch(error) {
        local_console.error(error);
      }

    });

    js_interactives[interactive_id] = {}
    code_blocks.slice(1).each((i, el) => {
      // Turn each additional code block into a function that fills in the
      // editor with the provided text example.
      // Example: js_interactives.some_unique_id.ex_1()
      const code_ex = $(el);
      const ex_text = code_ex.text().trim();
      js_interactives[interactive_id]["ex_"+(i+1)] = function() {
        //
        cm.setValue(ex_text);
        $("html").animate({scrollTop: wrapper.offset().top}, 500);
      }
      code_ex.parent().hide();
    });
  })
});
