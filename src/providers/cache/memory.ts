import {CacheProvider} from './cacheProvider';
import {Config} from '../../classes/config';
import * as moment from 'moment';

export class MemoryCacheItem {
    obj:object = {};
    ttl:Date | undefined = moment().add(1, 'h').toDate();

    constructor(obj:object, ttl?:Date) {
        this.obj = obj;
        if(ttl) {
        this.ttl = ttl;
        }
    }

    isValid(): boolean {
        let result = true;

        if(this.ttl) {
            if(this.ttl.getTime() < Date.now()) {
                result = false;
            }
        }

        return result;
    }
}

export class MemoryCache implements CacheProvider {

    __store = new Map<string, MemoryCacheItem>();
    __config = new Config();

    get(name:string) : object | undefined {
        let result: object | undefined;
        
        if(this.__store.has(name)) {
        
            let item = this.__store.get(name);
            if(item!.isValid()) {
                result = item!.obj;
            }
        }

        return result;
    }

    set(name:string, obj:object, ttl?:Date) {

        if(!ttl) {
            ttl = moment().add(this.__config.cacheTTL, 'm').toDate();
        }

        this.__store.set(name, new MemoryCacheItem(obj, ttl));
    }

    delete(name:string) {
        this.__store.delete(name);
    }

    setConfig(config:Config) : void {
        this.__config;
    }
}