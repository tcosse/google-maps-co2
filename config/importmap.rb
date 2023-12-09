# Pin npm packages by running ./bin/importmap

pin "application", preload: true
pin "@hotwired/turbo-rails", to: "turbo.min.js", preload: true
pin "@hotwired/stimulus", to: "stimulus.min.js", preload: true
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js", preload: true
pin_all_from "app/javascript/controllers", under: "controllers"
pin "jszip", to: "https://ga.jspm.io/npm:jszip@3.10.1/lib/index.js"
pin "#lib/internal/streams/stream.js", to: "https://ga.jspm.io/npm:readable-stream@2.3.8/lib/internal/streams/stream-browser.js"
pin "buffer", to: "https://ga.jspm.io/npm:@jspm/core@2.0.1/nodelibs/browser/buffer.js"
pin "core-util-is", to: "https://ga.jspm.io/npm:core-util-is@1.0.3/lib/util.js"
pin "events", to: "https://ga.jspm.io/npm:@jspm/core@2.0.1/nodelibs/browser/events.js"
pin "immediate", to: "https://ga.jspm.io/npm:immediate@3.0.6/lib/browser.js"
pin "inherits", to: "https://ga.jspm.io/npm:inherits@2.0.4/inherits_browser.js"
pin "isarray", to: "https://ga.jspm.io/npm:isarray@1.0.0/index.js"
pin "lie", to: "https://ga.jspm.io/npm:lie@3.3.0/lib/browser.js"
pin "pako", to: "https://ga.jspm.io/npm:pako@1.0.11/index.js"
pin "process", to: "https://ga.jspm.io/npm:@jspm/core@2.0.1/nodelibs/browser/process-production.js"
pin "process-nextick-args", to: "https://ga.jspm.io/npm:process-nextick-args@2.0.1/index.js"
pin "readable-stream", to: "https://ga.jspm.io/npm:readable-stream@2.3.8/readable-browser.js"
pin "safe-buffer", to: "https://ga.jspm.io/npm:safe-buffer@5.1.2/index.js"
pin "setimmediate", to: "https://ga.jspm.io/npm:setimmediate@1.0.5/setImmediate.js"
pin "string_decoder", to: "https://ga.jspm.io/npm:string_decoder@1.1.1/lib/string_decoder.js"
pin "util", to: "https://ga.jspm.io/npm:@jspm/core@2.0.1/nodelibs/browser/util.js"
pin "util-deprecate", to: "https://ga.jspm.io/npm:util-deprecate@1.0.2/browser.js"
pin "chart.js", to: "https://cdn.jsdelivr.net/npm/chart.js"
pin "bootstrap", to: "https://ga.jspm.io/npm:bootstrap@5.3.2/dist/js/bootstrap.esm.js"
pin "@popperjs/core", to: "https://ga.jspm.io/npm:@popperjs/core@2.11.8/lib/index.js"
