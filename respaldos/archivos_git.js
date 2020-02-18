const shellExec =require('shell-exec');
async function backupArc(ruta, rama)
{
    let resp = await shellExec(`cd ${ruta} && git branch`);
    console.log(`cd ${ruta} && git branch:`+resp.stdout);
    if(!resp.stdout.includes(`* ${rama}`))
    {
        console.log(`* ${rama}:`+resp.stdout);
        resp = await shellExec(`cd ${ruta} && git checkout ${rama}`);
        console.log(`cd ${ruta} && git checkout ${rama}:`+resp.stdout);
        if(!resp.stderr.includes(`Switched to branch '${rama}'`)){console.error('error chk'); return false;}
    }
    resp = await shellExec(`cd ${ruta} && git status`);
    console.log(`cd ${ruta} && git status:`+resp.stdout);
    if(!resp.stdout.includes('Untracked files:')){console.log('Sin archivos pendientes'); return true;}
    resp = await shellExec(`cd ${ruta} && git add . && git commit -m "Respaldo" && git status`);
    if(!resp.stdout.includes('working tree clean')){console.error('error revisar');return false;}
    resp = await shellExec(`cd ${ruta} && git push origin ${rama} && git push origin ${rama}`);
    if(!resp.stderr.includes('Everything up-to-date')){console.error('error'); return false;}
    console.log('Todo correcto');
}
module.exports =
    {
        backupArc:backupArc
    }