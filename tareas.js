var respaldosArcGit      = require("./respaldos/archivos_git.js");
var respaldosbdMysql     = require("./respaldos/db_mysql.js");
var montoAsoproductos    = require('./notificaciones/monto-asoproductos.js');
var CronJob              = require('node-cron');

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

async function actDatCtas()
{
    console.log('Actualizando datos de cuentas');
    sql =`call p_dist_pag_act_cuentas()`;
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
        let resp = await oraConnAso.execute(sql, {}, opciones); 
        console.log('correcto:', resp);
    }
    catch(e)
    {
        console.error('Error en actDatCtas Asoportuguesa:');
        console.error(e);
        return false;
    }
}
//debug
console.log('Inicio de la tarea V1:');
console.log(Date());

var task = CronJob.schedule(
    /* '* * * * 1-5', */ // ejecucion 5:15 pm de lunes a viernes
    '15 17 * * 1-5', // ejecucion 5:15 pm de lunes a viernes
    ()=>{
        respaldosbdMysql.backup('asodocs', 'asodocs', 'fwalmai', '/home/web/backup_db/'); //respaldo base ASO/DOCS
        respaldosArcGit.backupArc('../documentos.asoportuguesa.org', 'master'); //respaldo archivos GIT
        montoAsoproductos.montoVentaDia(); //notificación via WhatsApp
        actDatCtas();
    },
    {
        schedule: false
    }
);

task.start();
