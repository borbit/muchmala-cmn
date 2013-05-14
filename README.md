Installation
============

1. Clone repository
2. Run `npm install`
        
        It is possible that you experience problems with installation of `node-canvas` on this step. Make sure that you have `cairo` installed.
        
        `brew install cairo`
        
        Probably it'll ask you to install pachage from here: [http://xquartz.macosforge.org/](http://xquartz.macosforge.org/)
        
        Also, if you do not have `XCode` installed (but only CLI Tools), you may have problem with `xcode-select`. Look for solution here: [http://stackoverflow.com/questions/12780858/xcode-4-5-command-line-tools-xcode-select-issue](http://stackoverflow.com/questions/12780858/xcode-4-5-command-line-tools-xcode-select-issue)
        
        After installing `cairo`, re-run `npm install`
        
        If you are still having problems with missing dependencies (something like `*.pc`), look in one of these locations: `/opt/X11/libpkgconfig`, `/usr/X11/lib/pkgconfig`. If any of them exist, run the following:
        
                export PKG_CONFIG_PATH=/usr/X11/lib/pkgconfig
                
        And re-run `npm install`

3. Now you can symlink `muchmala-cmn` to other parts of the project

