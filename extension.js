import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

var MiniPANAM=GObject.registerClass(class MiniPANAM extends PanelMenu.Button{
    _init(){
        super._init(0.0,"Mini-PANAM");
        this._p=new Gio.Settings({schema_id:'org.gnome.shell.extensions.mini-panam'});
        this.idArr=this._p.get_string('stop-id')||"";
        this._tokPerso=this._p.get_string('token-prim')||"";
        this._tokDefaut="pWzLCkq4o71PCWKynrjLgi5H3rcpNtfy";
        this.token=this._tokPerso||this._tokDefaut;
        this._boite=new St.BoxLayout({style_class:'panel-status-menu-box'});
        this._t1=new St.Label({text:"--",y_align:Clutter.ActorAlign.CENTER});
        this._t2=new St.Label({text:"--",y_align:Clutter.ActorAlign.CENTER});
        this._boite.add_child(this._t1);
        this._boite.add_child(new St.Label({text:" | ",y_align:Clutter.ActorAlign.CENTER}));
        this._boite.add_child(this._t2);
        this.add_child(this._boite);
        this._session=new Soup.Session();
        this._data=null;
        this._actif=false;
        this._timerApi=null;
        this._timerUI=null;
        this._timerOff=null;
        this._nomArr="";
        this._dir="";
        this._err="";
        this.connect('enter-event',()=>this._onEnter());
        this._setInactif();
        this._creerMenu();
        if(this.idArr)this._activer();
    }
    _creerMenu(){
        let sec=new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(sec);
        
        let creerLigne=(l,t,h,u)=>{
            let item=new PopupMenu.PopupBaseMenuItem({reactive:false});
            let boite=new St.BoxLayout({vertical:false,style:'spacing:8px;'});
            let label=new St.Label({text:l,y_align:Clutter.ActorAlign.CENTER});
            let entree=new St.Entry({text:t,hint_text:h,y_align:Clutter.ActorAlign.CENTER});
            let aide=new St.Button({style_class:'circular',child:new St.Label({text:"?",style:'font-weight:bold;font-size:20px;'}),y_align:Clutter.ActorAlign.CENTER,style:'min-width:24px;min-height:24px;'});
            aide.connect('clicked',(a,e)=>{Util.spawnCommandLine('xdg-open '+u);e.stop_propagation();return true;});
            boite.add_child(label);
            boite.add_child(entree);
            boite.add_child(aide);
            item.add_child(boite);
            sec.addMenuItem(item);
            return entree;
        };
        
        this._eArr=creerLigne("Arrêt:",this.idArr,"Ex: 22087","https://prim.iledefrance-mobilites.fr/fr/jeux-de-donnees/arrets-lignes");
        this._eTok=creerLigne("Token:",this._tokPerso,"Laissez vide pour token public","https://prim.iledefrance-mobilites.fr/fr/mes-jetons-authentification");
        
        this._eArr.clutter_text.connect('text-changed',()=>{
            this.idArr=this._eArr.get_text();
            this._p.set_string('stop-id',this.idArr);
            if(this.idArr.length>2)this._activer();
        });
        
        this._eTok.clutter_text.connect('text-changed',()=>{
            let t=this._eTok.get_text();
            if(t){this._tokPerso=t;this._p.set_string('token-prim',t);}
            else{this._tokPerso="";this._p.set_string('token-prim',"");}
            this.token=t||this._tokDefaut;
            if(this.idArr&&this.token)this._activer();
        });
        
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._info=new PopupMenu.PopupMenuItem("Aucun arrêt configuré");
        this._info.setSensitive(false);
        this.menu.addMenuItem(this._info);
    }
    _majInfo(){
        if(this._err)this._info.label.text="Erreur : "+this._err;
        else if(this._nomArr&&this._dir){
            let t=`${this._nomArr} → ${this._dir}`;
            if(t.length>40)t=t.substring(0,37)+"...";
            this._info.label.text=t;
        }else if(this.idArr&&this.token){
            let inf=this._tokPerso?" (token perso)":" (token public)";
            this._info.label.text="Configuration valide"+inf;
        }else this._info.label.text="Aucun arrêt configuré";
    }
    _onEnter(){if(!this._actif)this._activer();}
    _activer(){
        if(this._actif)return;
        this._actif=true;
        this._err="";
        this._startTimers();
        this._fetch();
    }
    _desactiver(){
        if(!this._actif)return;
        this._actif=false;
        this._data=null;
        this._stopTimers();
        this._setInactif();
        this._majInfo();
    }
    _startTimers(){
        this._timerApi=GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,10,()=>{this._fetch();return this._actif;});
        this._timerUI=GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,5,()=>{this._majUI();return this._actif;});
        this._timerOff=GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,300,()=>{this._desactiver();return false;});
    }
    _stopTimers(){
        if(this._timerApi){GLib.source_remove(this._timerApi);this._timerApi=null;}
        if(this._timerUI){GLib.source_remove(this._timerUI);this._timerUI=null;}
        if(this._timerOff){GLib.source_remove(this._timerOff);this._timerOff=null;}
    }
    _setInactif(){this._t1.set_text("--");this._t2.set_text("--");this._boite.opacity=80;}
    _setActif(){this._boite.opacity=255;}
    _fmt(t){
        try{
            let arr=new Date(t);
            let now=new Date();
            let m=Math.floor((arr-now)/(1000*60));
            if(m<0)return"0min";
            if(m<60)return m+"min";
            let h=Math.floor(m/60);
            let r=m%60;
            return r===0?h+"h":h+"h"+r;
        }catch(e){return"N/A";}
    }
    _extraire(d){
        try{
            if(d.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]){
                let v=d.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit||[];
                if(v.length>0){
                    let vj=v[0].MonitoredVehicleJourney;
                    this._nomArr=vj.MonitoredCall?.StopPointName?.[0]?.value||"Arrêt inconnu";
                    this._dir=vj.DirectionName?.[0]?.value||"Direction inconnue";
                    this._err="";
                }
            }
        }catch(e){this._nomArr="";this._dir="";this._err="Erreur données";}
        this._majInfo();
    }
    _fetch(){
        if(!this.idArr||!this.token)return;
        let idComplet=this.idArr.includes(":")?this.idArr:`STIF:StopPoint:Q:${this.idArr}:`;
        let url=`https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=${encodeURIComponent(idComplet)}`;
        let req=Soup.Message.new('GET',url);
        req.get_request_headers().append('accept','application/json');
        req.get_request_headers().append('apiKey',this.token);
        this._session.send_async(req,GLib.PRIORITY_DEFAULT,null,(session,res)=>{
            try{
                let rep=session.send_finish(res);
                if(req.get_status()===Soup.Status.OK){
                    let flux=rep;
                    let chunks=[];
                    let chunk=flux.read_bytes(4096,null);
                    while(chunk&&chunk.get_size()>0){
                        chunks.push(chunk.get_data());
                        chunk=flux.read_bytes(4096,null);
                    }
                    let total=new Uint8Array(chunks.reduce((a,b)=>a+b.length,0));
                    let off=0;
                    for(let c of chunks){total.set(c,off);off+=c.length;}
                    let txt=new TextDecoder().decode(total);
                    this._data=JSON.parse(txt);
                    this._extraire(this._data);
                    this._majUI();
                }else this._err="HTTP "+req.get_status();
            }catch(e){this._err="Erreur connexion";}
            this._majInfo();
        });
    }
    _majUI(){
        if(!this._actif||!this._data)return;
        let t1="N/A",t2="N/A";
        try{
            let d=this._data;
            if(d.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]){
                let v=d.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit||[];
                if(v.length>0){
                    let a1=v[0].MonitoredVehicleJourney.MonitoredCall;
                    if(a1?.ExpectedArrivalTime)t1=this._fmt(a1.ExpectedArrivalTime);
                }
                if(v.length>1){
                    let a2=v[1].MonitoredVehicleJourney.MonitoredCall;
                    if(a2?.ExpectedArrivalTime)t2=this._fmt(a2.ExpectedArrivalTime);
                }
            }
        }catch(e){this._err="Erreur affichage";this._majInfo();}
        this._t1.set_text(t1);
        this._t2.set_text(t2);
        this._setActif();
    }
    destroy(){this._stopTimers();super.destroy();}
});

let _ext;
export default class{
    init(){}
    enable(){_ext=new MiniPANAM();Main.panel.addToStatusArea('mini-panam',_ext,1,'right');}
    disable(){if(_ext)_ext.destroy();_ext=null;}
}
