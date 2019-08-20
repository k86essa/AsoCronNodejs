var request =require("request");
var oraBase =require("oracledb");
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
var CronJob =require('cron').CronJob;
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
        respUltVal = await oraConnAsopr.execute(oraQueriesAsopr.ultValTasaEuroDicom, {}, opciones); 
        let ultValED =respUltVal.rows[0].VA_VARIABLE; //Ultimo valor de Euro Dicom
        console.log('DOLAR base');
        console.log(ultValDD);
        console.log('DOLAR api');
        console.log(body.USD.sicad2);
        console.log('EURO base');
        console.log(ultValED);
        console.log('EURO api');
        console.log(body.EUR.sicad2);
        if(ultValDD != body.USD.sicad2) //Verifica tasa Dolar Dicom
        {//si el ultimo valor de la tasa es distinto al recibido por el API, se actualiza
            let respIns = await oraConnAsopr.execute(oraQueriesAsopr.actTasaDolarDicom, [body.USD.sicad2], opciones);
        }
        if(ultValED != body.EUR.sicad2) //Verifica tasa Euro Dicom
        {//si el ultimo valor de la tasa es distinto al recibido por el API, se actualiza
            let respIns = await oraConnAsopr.execute(oraQueriesAsopr.actTasaEuroDicom, [body.EUR.sicad2], opciones);
        }
    }
    catch(e)
    {
        console.error('Error en actTasaDolarDicom Asoproductos:');
        console.error(e);
        //process.exit();
        return;
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
            let respIns = await oraConnAso.execute(oraQueriesAso.actTasaDolarDicom, [body.USD.sicad2], opciones);
        }
    }
    catch(e)
    {
        console.error('Error en actTasaDolarDicom Asoportuguesa:');
        console.error(e);
        //process.exit();
        return;
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
//debug
console.log('Inicio de la tarea V1:');
console.log(Date());
new CronJob(
    //'* * * * * *',     //verifica cada segundo
    //'0 */10 * * * *', //verifica cada 10 minutos
    //'0 7 * * *',        //verifica cada dia a las 7 am
    '0 11 * * *',        //verifica cada dia a las 11 am
    actualizarTasaDT,
    function()
    {
        console.log('termino la tarea');
    },
    true
);



