const Interfaces = imports.misc.interfaces;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const CinnamonDesktop = imports.gi.CinnamonDesktop;
const Lang = imports.lang;
const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Main = imports.ui.main;

const SignalManager = imports.misc.signalManager;


class MultidisplaySession extends Applet.IconApplet {
    constructor(orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        this.set_applet_icon_symbolic_name("preferences-desktop-display");
        this.set_applet_tooltip(_("Multidisplay"));

        this.signals = new SignalManager.SignalManager(null);
        this.signals.connect(global.screen, 'window-monitor-changed', this._onWindowMonitorChanged, this);

        try {
            this._screen = new CinnamonDesktop.RRScreen({ gdk_screen: Gdk.Screen.get_default() });
            this._screen.init(null);
        } catch(e) {
            // an error means there is no XRandR extension
            global.logError(e);
            this.actor.hide();
            return;
        }

        this._screen.connect('output_disconnected', Lang.bind(this, this._screen_disconnect));
        this._screen.connect('output_connected', Lang.bind(this, this._screen_connect));

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);
        this.window_session = {}
        this.window_session_d = {}

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);
        
        this._showFixedElements();
    }

    _screen_connect() {
        let windows = global.get_window_actors();
        this.window_session_d = {}

        for(let m of windows) {
            let mw = m.meta_window
            mw.move_to_monitor(this.window_session_d[mw])
        }
    }

    _screen_disconnect() {
        let windows = global.get_window_actors();
        this.window_session_d = {}

        for(let m of windows) {
            let mw = m.meta_window
            this.window_session_d[mw] = this.window_session[mw]
        }
    }

    _showFixedElements() {
        let moveAllToPrimaryDisplay = new PopupMenu.PopupMenuItem(
            _('Move all windows to primary display'));

        moveAllToPrimaryDisplay.connect('activate', () => this.moveAllToPrimaryDisplay());
        this.menu.addMenuItem(moveAllToPrimaryDisplay);

        let saveSession = new PopupMenu.PopupMenuItem(
            _('Save the current session')
        )

        saveSession.connect('activate', () => this.saveSession());
        this.menu.addMenuItem(saveSession);

        let loadSession = new PopupMenu.PopupMenuItem(
            _('Load the saved session'))
        loadSession.connect('activate', () => this.loadSession());
        this.menu.addMenuItem(loadSession)
    }

    _onWindowMonitorChanged(screen, metaWindow, monitor) {
        //this.window_session[metaWindow] = monitor
    }

    on_applet_clicked(event) {
        this._openMenu();
    }
    
    _openMenu() {
        this.menu.toggle();
    }

    moveAllToPrimaryDisplay() {
        let windows = global.get_window_actors();

        for(let m of windows) {
            let mw = m.meta_window
            mw.move_to_monitor(Main.layoutManager.primaryMonitor.index)
        }
    }

    saveSession(){
        let windows = global.get_window_actors();
        this.window_session = []

        for(let m of windows) {
            let mw = m.meta_window
            //for (var prop in mw){
            //    global.log(prop)
            //}

            this.window_session[mw] = mw.get_monitor()
            //global.log("-----")
            
            //break
        }
    }

    loadSession() {
        let windows = global.get_window_actors();
        
        for (let m of windows){
            let mw = m.meta_window
            mw.move_to_monitor(this.window_session[mw])
        }
    }
}

function main(metadata, orientation, panel_height, instance_id) {
    return new MultidisplaySession(orientation, panel_height, instance_id);
}