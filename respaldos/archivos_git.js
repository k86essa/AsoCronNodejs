const shellExec =require('shell-exec');
async function backupArc(ruta, rama)
{
    let resp = await shellExec(`cd ${ruta} && git branch`);
    if(!resp.stdout.includes(`* ${rama}`))
    {
        resp = await shellExec(`cd ${ruta} && git checkout ${rama}`);
        if(!resp.stderr.includes(`Switched to branch '${rama}'`)){console.error('error chk'); return false;}
    }
    resp = await shellExec(`cd ${ruta} && git status`);
    if(!resp.stdout.includes('Untracked files:')){console.log('Sin archivos pendientes'); return true;}
    resp = await shellExec(`cd ${ruta} && git add . && git commit -m "respaldo" && git status`);
    if(!resp.stdout.includes('working tree clean')){console.error('error revisar');return false;}
    resp = await shellExec(`cd ${ruta} && git push origin ${rama} && git push origin ${rama}`);
    if(!resp.stderr.includes('Everything up-to-date')){console.error('error'); return false;}
    console.log('Todo correcto');
}
module.exports =
    {
        backupArc:backupArc
    }