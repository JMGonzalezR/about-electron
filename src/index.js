/**
 * @author Juan González <juanmml93@gmail.com>  on 12/6/2016.
 */

'use strict';


const electron = require('electron');
const path = require('path');
const fs = require('fs');


var window= null;

function loadPackageJson(pkg_pat){
      try {
            return require(pkg_path);
      } catch (e) {
            return null;
      }
}

function detectPackageJson(specified_dir) {
      if (specified_dir) {
            const pkg = loadPackageJson(path.join(specified_dir, 'package.json'));
            if (pkg !== null) {
                  return pkg;
            } else {
                  console.warn('about-window: package.json is not found in specified directory path: ' + specified_dir);
            }
      }

      const app_name = electron.app.getName();

      module.paths.forEach(function(mod_path){
            if (path.isAbsolute(mod_path)) {
                  const p = path.join(mod_path, '..', 'package.json');
                  try {
                        const stats = fs.statSync(p);
                        if (stats.isFile()) {
                              const pkg = loadPackageJson(p);
                              if (pkg !== null && pkg.productName === app_name) {
                                    return pkg;
                              }
                        }
                  } catch (e) {
                        // File not found.  Ignored.
                  }
            }


      });
      // Note: Not found.
      return null;
}

function injectInfoFromPackageJson(info) {
      const pkg = detectPackageJson(info.package_json_dir);
      if (pkg === null) {
            // Note: Give up.
            return info;
      }

      if (!info.description) {
            info.description = pkg.description;
      }
      if (!info.license && pkg.license) {
            const l = pkg.license;
            info.license = typeof l === 'string' ? l : l.type;
      }
      if (!info.homepage) {
            info.homepage = pkg.homepage;
      }
      if (!info.bug_report_url && typeof (pkg.bugs) === 'object') {
            info.bug_report_url = pkg.bugs.url;
      }
      if (info.use_inner_html === undefined) {
            info.use_inner_html = false;
      }

      return info;
}

function openAboutWindow(info) {
      if (window !== null) {
            window.focus();
            return window;
      }

      const index_html = 'file://' + path.join(__dirname, '..', 'about.html');

      const options = Object.assign(
          {
                width: 400,
                height: 400,
                useContentSize: true,
                titleBarStyle: 'hidden-inset',
                show: !info.adjust_window_size,
          },
          info.win_options || {}
      );

      window = new electron.BrowserWindow(options);

      window.once('closed', function(){
            window = null;
});
      window.loadURL(index_html);

      window.webContents.on('will-navigate', function(e, url){
            e.preventDefault();
      electron.shell.openExternal(url);
});
      window.webContents.on('new-window', function(e, url){
            e.preventDefault();
      electron.shell.openExternal(url);
});

      window.webContents.once('dom-ready', function(){
            delete info.win_options;
      window.webContents.send('about-window:info', info);
      if (info.open_devtools) {
            if (process.versions.electron >= '1.4') {
                  window.webContents.openDevTools({mode: 'detach'});
            } else {
                  window.webContents.openDevTools();
            }
      }
});

      window.once('ready-to-show', function(){
            window.show();
});

      window.setMenu(null);

      info = injectInfoFromPackageJson(info);

      return window;
}

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = openAboutWindow;