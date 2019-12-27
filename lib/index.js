'use strict'

const { PooledQldbDriver, createQldbWriter } = require('amazon-qldb-driver-nodejs');
const { Decimal, decodeUtf8, IonTypes, makePrettyWriter, Timestamp } = require('ion-js');

class Util {

    static async OpenSession(ledgerName, configOptions) {
        if(!configOptions) {
            configOptions = { 
                              region: process.env.AWS_REGION,
                              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                            }
        }
        // console.log("configOptions",configOptions);
        try {
            const QldbDriver = new PooledQldbDriver(ledgerName, configOptions);
            const QldbSession = await QldbDriver.getSession();

            return QldbSession;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static async CloseSession(session) {
        if(session !== null)
            session.close();
    }

    static writeValueAsIon(value, ionWriter) {
        try {
            switch (typeof value) {
                case "string":
                    ionWriter.writeString(value);
                    break;
                case "boolean":
                    ionWriter.writeBoolean(value);
                    break;
                case "number":
                    ionWriter.writeInt(value);
                    break;
                case "object":
                    if (Array.isArray(value)) {
                        // Object is an array.
                        ionWriter.stepIn(IonTypes.LIST);
                        for (const element of value) {
                            this.writeValueAsIon(element, ionWriter);
                        }
                        ionWriter.stepOut();
                    }
                    else if (value instanceof Date) {
                        // Object is a Date.
                        ionWriter.writeTimestamp(Timestamp.parse(value.toISOString()));
                    }
                    else if (value instanceof Decimal) {
                        // Object is a Decimal.
                        ionWriter.writeDecimal(value);
                    }
                    else if (value === null) {
                        ionWriter.writeNull(IonTypes.NULL);
                    }
                    else {
                        // Object is a struct.
                        ionWriter.stepIn(IonTypes.STRUCT);
                        for (const key of Object.keys(value)) {
                            ionWriter.writeFieldName(key);
                            this.writeValueAsIon(value[key], ionWriter);
                        }
                        ionWriter.stepOut();
                    }
                    break;
                default:
                    throw new Error(`Cannot convert to Ion for type: ${(typeof value)}.`);
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static JsonToIonValues(jsonValue) {
        try {
            let _writer = createQldbWriter();
               
            Util.writeValueAsIon(jsonValue, _writer);

            return _writer;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static async queryExecute(ledger, query, parameters) {
        let session = null;
        let result;

        try {
            session = await Util.OpenSession(ledger, {});

            if(query.indexOf("?") > 0) {
                let queryParams = [];
                let params = [];

                if(Array.isArray(parameters))
                    params = [...parameters];
                else
                    params.push(parameters);

                params.forEach(param => queryParams.push(Util.JsonToIonValues(param)));

                result = await session.executeStatement(query, queryParams);
            }
            else
                result = await session.executeStatement(query);

            return Util.QldbResultToJson(result);
        } catch (error) {
            console.log(error);
            throw error;
        }
        finally {
            Util.CloseSession(session);
        }
    }

    static async getTables(ledger){
        let session = null;

        try {
            session = await Util.OpenSession(ledger, {})

            const tables = await session.getTableNames()
             console.log("tabelas",tables);
            return tables

        } catch (error) {
            console.log(error);
            throw error;
        } finally{
            Util.CloseSession(session)
        }
    }
    
    static async getDocumentId(ledger, tableName, field, value) {
        try {
            let query = `SELECT id FROM ${tableName} AS t BY id WHERE t.${field} = ?`;
            let result = await Util.queryExecute(ledger, query, value);

            if(result.length < 1)
                throw new Error(`Não foi possivel recuperar o documentId usando o valor '${value}' no campo '${field}'.`);

            return result.id;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static PrettyPrint(result){
        try {
            const writer = makePrettyWriter();
            const response = result.getResultList();

            response.forEach((reader) => {
                writer.writeValues(reader);
            });
            
            return decodeUtf8(writer.getBytes());
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static distinct(arr){
        return [...new Set(arr)];
    }

    static insert_at(txt, index, char)
    {
        return txt.substring(0, index) + char + txt.substring(index);
    }

    static getPropNames(txt, arrDelimitadores) {
        try {
            let ret = [];
            let prop;

            txt = txt.replace(/\s/g,'');

            let doisPontos = txt.indexOf(':');

            if(doisPontos < 0)
                return [];

            for(let i = doisPontos; i >= 0; i--){
                if(arrDelimitadores.includes(txt[i])){
                    prop = txt.substring(i+1, doisPontos);
                    break;
                }
            }

            ret.push(prop);
            ret.push(...Util.getPropNames(txt.substring(doisPontos+1), arrDelimitadores));

            return ret;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static qldbResultToJson(result){
        try {
            let semiJson = Util.PrettyPrint(result).replace(/\s/g,'');

            if(semiJson === "")
                return;

            let props = Util.distinct(Util.getPropNames(semiJson, [',','{']));
            let JsonResult ="";

            props.forEach(prop => {
                semiJson = semiJson.replace(new RegExp(prop + ':', 'g'), '"' + prop + '":');
            });

            if(semiJson.indexOf('}{') > 0)
            {
                semiJson = Util.insert_at(semiJson, 0, '[');
                semiJson = Util.insert_at(semiJson, semiJson.lastIndexOf('}') + 1 , ']');
            }

            semiJson = semiJson.replace(new RegExp('}{', 'g'), '},{');
            JsonResult = JSON.parse(semiJson);

            return JsonResult;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    static ViewDataHistory(ledger, table, documentId) {
        try {
            let query = `SELECT data as linha, metadata.version as versao FROM history(${table}) AS h WHERE h.metadata.id = ?`;

            return Util.queryExecute(ledger, query, documentId);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

module.exports = Util;