const shellExec =require('shell-exec');
async function shell()
{
    let resp = await shellExec('cd ../gitPrueba && git status');
    let arcPendientes = resp.stdout.includes('Untracked files:');
    if(arcPendientes)
    {
        resp = await shellExec('git add .');
        resp = await shellExec('git commit -m "respaldo"');
        console.log(resp);
        /*resp = await shellExec('git status');
        let arcPendCommit = resp.stdout.includes('Changes to be committed:');
        if(arcPendCommit)
        {
            resp = await shellExec('git commit -m "Respaldo automatico de nuevos archivos"');
           
        }*/
    }
    else
    {
        console.log('sin archivos pendientes');
    }
}
module.exports =
    {
        shell:shell        
    }