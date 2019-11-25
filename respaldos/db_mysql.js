const shellExec =require('shell-exec');
async function backup(base, usr, pass, ruta)
{
    let resp = await shellExec(`mysqldump -u ${usr} -p${pass} ${base} | bzip2 -c > ${ruta}${base}$(date +%Y-%m-%d-%H.%M.%S).sql.bz2`);
    console.log(resp);
}
module.exports =
    {
        backup:backup
    }