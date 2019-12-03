var numeros   = require("../config/contactos-list.js");
var listaApis = require("../config/lista-apis.js");
var format    = require('currency-formatter');
var conexion  = require('../config/conexion.js');
var oraCredencialesAso = require("../config/config-base").asoportuguesa.prod;
var oraCredencialesAsopr = require("../config/config-base").asoproductos.prod;
var oraQueriesAso = require("../config/queries-base").asoportuguesa;
var oraQueriesAsopr = require("../config/queries-base").asoproductos;
var oraBase = require("oracledb");
var request = require('request');
//oraBase.queueTimeout =6000;
//oraBase.poolTimeout =10;
oraBase.fetchAsString = [ oraBase.CLOB ];

async function montoVentaDia()
{
    console.log('Consultando Monto total de ventas Asoproductos');
    let oraConnAsopr = await conexion.obtConexion(oraCredencialesAsopr);
    if(!oraConnAsopr)
    {
        console.log('Fallo al conectar con Asoproductos');
        return;
    }
    opciones  ={
        outFormat: oraBase.OBJECT,
        autoCommit: true
    }
    try
    {
        let consult = await oraConnAsopr.execute(oraQueriesAsopr.TotalVentaDia, {}, opciones); 
        let monto =consult.rows[0].TOTAL_VENTAS_DIA; //ultimo valor de Dolar Dicom

        if (monto != null) {
            var bs = format.format(monto, {
                /* code: 'BSS',
                symbol: 'BsS ', */
                thousandsSeparator: ',',
                decimalSeparator: '.',
                symbolOnLeft: true,
                spaceBetweenAmountAndSymbol: false,
                decimalDigits: 2,
                format: '%v %s'
            });
        } else {
            return 0;
        }

        console.log(Date()); // mostramos fecha de cada consulta
        console.log('Monto: ' + bs); // mostramos el monto consultado

        var texto = '\n*ASOPRODUCTOS*\nVenta total del dia: ' + bs;
        var textoprueba = '\n*ASOPRODUCTOS*\nPrueba de envio';
        
        for (let i = 0; i < numeros.contactNiceApi.length; i++) {
            enviarMensajes(
                texto,
                numeros.contactNiceApi[i].numero
            );
            await retraso(65000);
            
        }
    }
    catch(e)
    {
        console.error('Error en monto Venta Dia Asoproductos:');
        console.error(e);
        return false;
    }
}
async function retraso(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
}
async function enviarMensajes(texto,number)
{
    var body = JSON.stringify({
        APIId    : listaApis.niceApi.token2,
        APIMobile: number,
        Message  : texto
    });
    
    var postBody = {
      url: listaApis.niceApi.link,
      body: body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    
    request.post(postBody, function(error, res, body) {
      if (error) {
        console.error(error)
        return
      }
      console.log(`statusCode: ${res.statusCode}`)
      console.log(body);
      return;
    });
}

module.exports = {
    montoVentaDia : montoVentaDia
}
