/**
 * Created by yaozh on 2017/12/6.
 * 本类用于存储项目的各种设置，相当于一个简单的hash表
 */

class Param
{
    static setParam(key, value){
        Param.map.set(key, value);
    }

    static getParam(key){
        return Param.map.get(key);
    }

    static removeParam(key){
        delete Param.map.delete(key);
    }
}

Param.map = new Map();

module.exports = Param;