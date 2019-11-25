const shellExec =require('shell-exec');
async function shell()
{
    let resp = await shellExec('cd ../gitPrueba && git status');
    console.log(resp);
    let arcPendientes = resp.stdout.includes('Untracked files:');
    if(arcPendientes)
    {
        resp = await shellExec('cd ../gitPrueba && git add . && git commit -m "respaldo" && git status');
        let fin = resp.stdout.includes('working tree clean');
        if(fin){console.log('finalizado correctamente');}
        else{console.log('error revisar')}
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