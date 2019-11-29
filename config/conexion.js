var oraBase = require("oracledb");
//oraBase.queueTimeout =6000;
//oraBase.poolTimeout =10;
oraBase.fetchAsString = [ oraBase.CLOB ];

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

module.exports = {
    obtConexion : obtConexion
}