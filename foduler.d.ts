declare namespace foduler {
    interface IFodule {
        as(alias: string): IFodule;
        value(name: string, value: any): IFodule;
        factory(name: string, factory: Function): IFodule;
        factory(name: string, handlers: any[]): IFodule;

        on(event: string, factory: Function): IFodule;
        on(event: string, handlers: any[]): IFodule;

        include(module: any): IFodule;

        config(factory: Function): IFodule;
        config(handlers: any[]): IFodule;

        run(factory: Function): IFodule;
        run(handlers: any[]): IFodule;
    }
    
    interface IModuler {
        module(name: string): IFodule;
    }

    export function factory(instanceName: string):IModuler;

    export function start($foduler: IModuler): void;

    export var varsion: string;
}


declare module "foduler" {
    export = foduler;
}