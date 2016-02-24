declare namespace foduler {
    interface IFodule {
        $name: string;
        as(alias:string): IFodule;
        value(name:string, value:any): IFodule;
        factory(name:string, factory:Function): IFodule;
        factory(name:string, handlers:any[]): IFodule;

        on(event:string, factory:Function): IFodule;
        on(event:string, handlers:any[]): IFodule;

        include(module:any): IFodule;

        config(factory:Function): IFodule;
        config(handlers:any[]): IFodule;

        run(factory:Function): IFodule;
        run(handlers:any[]): IFodule;
    }

    interface IModuler {
        module(name:string): IFodule;
    }

    interface IModuler {
        $system: system.$factories;
    }

    export module system {
        interface $factories {
            $lodash: string,
            $promise: string,
            $emit: string,
        }
        interface appFactoryOptions {
            base?: any,
            before?: any,
            options?: any
        }
        export interface appFactory {
            (path:string, options:appFactoryOptions): void;
        }
    }
}

declare namespace $foduler {
    export function factory(instanceName:string):foduler.IModuler;

    export function start($foduler:foduler.IModuler):void;

    export var varsion:string;
}
declare module "foduler" {
    export = $foduler ;
}