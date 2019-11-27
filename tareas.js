//const clienteM =require('twilio')();
var respaldosArcGit = require("./respaldos/archivos_git.js");
var respaldosbdMysql = require("./respaldos/db_mysql.js");
var numeros = require("./contactos-list.js");
var request =require("request");
var oraBase =require("oracledb");
var format = require('currency-formatter');
//oraBase.queueTimeout =6000;
//oraBase.poolTimeout =10;
oraBase.fetchAsString = [ oraBase.CLOB ];
//Credenciales BD
var oraCredencialesAso =require("./config-base").asoportuguesa
.prod;
//.test;
var oraCredencialesAsopr =require("./config-base").asoproductos
.prod;
//Queries BD
var oraQueriesAso =require("./queries-base").asoportuguesa;
var oraQueriesAsopr =require("./queries-base").asoproductos;
//Lista de API's a usar
var listaApis =require("./lista-apis.js");
var CronJob =require('node-cron');
async function obtConexion(credenciales)
{//obtener conexion con la base de dato
    try
    {
    oraConn = await 
    Promise.race(
        [
            oraBase.getConnection({
                user			:credenciales.usuario,
                password		:credenciales.contrasenia,
                connectString	:credenciales.cadenaConn
            })
            .then(conn =>
                {
                    return conn;
                }
            ),
            new Promise(
                (resolve, reject)=>
                {
                    setTimeout(
                        ()=>
                        {
                            reject('Tiempo de espera excedido');
                        },
                        5000
                    );
                }
            )
        ]
    );
    }
    catch(e)
    {
        console.error(e);
        return false;
    }
    return oraConn;
}
async function actualizarTasaDTAsopr(body)
{
    console.log('Actualizando Asoproductos');
    let oraConnAsopr = await obtConexion(oraCredencialesAsopr);
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
        let respUltVal = await oraConnAsopr.execute(oraQueriesAsopr.ultValTasaDolarDicom, {}, opciones); 
        let ultValDD =respUltVal.rows[0].VA_VARIABLE; //ultimo valor de Dolar Dicom
        if(ultValDD != body.USD.sicad2) //Verifica tasa Dolar Dicom
        {//si el ultimo valor de la tasa es distinto al recibido por el API, se actualiza
            //let respIns = await oraConnAsopr.execute(oraQueriesAsopr.actTasaDolarDicom, [body.USD.sicad2], opciones);
            //if(respIns.rowsAffected > 0)
            //{//si afecto algun registro en la base de datos
                enviarMensajes(`Atencion !!! La tasa del Dollar ha cambiado a: ${body.USD.sicad2}
                Se requiere actualizar la tasa en el Sistema. 
                ADVERTENCIA: Esta No ha sido actualizada en el Sistema.`);
            //}
        }
    }
    catch(e)
    {
        console.error('Error en actTasaDolarDicom Asoproductos:');
        console.error(e);
        //process.exit();
        return false;
    }
}
async function actualizarTasaDTAso(body)
{
    console.log('Actualizando Asoportuguesa');
    let oraConnAso = await obtConexion(oraCredencialesAso);
    if(!oraConnAso)
    {
        console.log('Fallo al conectar con Asoportuguesa');
        return;
    }
    opciones  ={
        outFormat: oraBase.OBJECT,
        autoCommit: true
    }
    try
    {
        let respUltVal = await oraConnAso.execute(oraQueriesAso.ultValTasaDolarDicom, {}, opciones); 
        let ultVal =respUltVal.rows[0].VA_VARIABLE;
        if(ultVal != body.USD.sicad2)
        {//si el ultimo valor de la tasa es distinto al recibido por el API, se actualiza
            //let respIns = await oraConnAso.execute(oraQueriesAso.actTasaDolarDicom, [body.USD.sicad2], opciones);
            //if(respIns.rowsAffected > 0)
            //{//si afecto algun registro en la base de datos
                enviarMensajes(`Atencion !!! La tasa del Dollar ha cambiado a: ${body.USD.sicad2}
                Se requiere actualizar la tasa en el Sistema. 
                ADVERTENCIA: Esta No ha sido actualizada en el Sistema.`);
            //}
        }
    }
    catch(e)
    {
        console.error('Error en actTasaDolarDicom Asoportuguesa:');
        console.error(e);
        //process.exit();
        return false;
    }
}
async function actualizarTasaDT()
{//actualiza las tasas
    request(
        listaApis.DTAPI,
        {
            json: true
        },
        async (err, res, body) =>
        {
            if(err)
            {
                console.error('Error en la consulta a DTAPI:');
                console.error(err);
                //process.exit();
                return;
            }
            actualizarTasaDTAso(body);
            actualizarTasaDTAsopr(body);
        }
    );
}
async function montoVentaDia()
{
    console.log('Consultando Monto total de ventas Asoproductos');
    let oraConnAsopr = await obtConexion(oraCredencialesAsopr);
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
    }
    catch(e)
    {
        console.error('Error en montoVentaDia Asoproductos:');
        console.error(e);
        //process.exit();
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

//debug
console.log('Inicio de la tarea V1:');
console.log(Date());

var task = CronJob.schedule(
    '15 17 * * 1-5', // ejecucion 5:15 pm
    ()=>{
        respaldosbdMysql.backup('asodocs', 'asodocs', 'fwalmai', '/home/web/backup_db/'); //respaldo base ASO/DOCS
        respaldosArcGit.backupArc('../asodocs', 'master'); //respaldo archivos GIT
        montoVentaDia(); //notificación via WhatsApp
    },
    {
        schedule: false
    }
);

task.start();