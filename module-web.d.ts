///<reference path="foduler.d.ts"/>

declare module Foduler.web {

    export module factory {
        export interface appFactory {
            (app:any):  Express.Application;
        }
        export interface routerFactory {
            (path:string, options:routerFactoryOptions):  Express.Application;
        }
    }



}

interface routerFactoryOptions {
    base? : any;
    before? : Array<any> | Function;
    routerOptions? : Object;
}

declare var fw: Foduler.Fodule;
declare module "foduler/module-web" {
    export = fw;
}
