declare namespace foduler {


    interface IModuler {
        $web: web.$factories;
    }

    export module web {
        interface $factories {
            express: string,
            session: string,
            favicon: string,
            morgan: string,
            bodyParser: string,
            cookieParser: string,
            appFactory: string,
            app: string,
            routerFactory: string,
            tools: string,
            toolPaging: string,
            toolOrdering: string,
            toolFiltering: string,
            validator: string,
            promiseExpress: string
        }
        interface routerFactoryOptions {
            base?: any,
            before?: any,
            options?: any
        }
        export interface routerFactory {
            (path:string, options:routerFactoryOptions): void;
        }
    }
}