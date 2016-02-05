declare namespace Foduler {
  interface Fodule {
      as(alias: string): Fodule;
      value(name: string, value: any): Fodule;
      factory(name: string, factory: Function): Fodule;
      factory(name: string, handlers: any[]): Fodule;

      on(event: string, factory: Function): Fodule;
      on(event: string, handlers: any[]): Fodule;

      include(module: any): Fodule;

      config(factory: Function): Fodule;
      config(handlers: any[]): Fodule;

      run(factory: Function): Fodule;
      run(handlers: any[]): Fodule;
  }
  export function factory(instanceName: string): Foduler;
  interface Foduler {
      varsion: string;
      module(name: string): Fodule;
      start(module: Fodule): Fodule;
  }


  export var varsion: string;
  export function module(name: string): Fodule;
  export function start(module: Fodule): Fodule;
}
declare module "foduler" {
  export = Foduler;
}
