import { ObjectId } from "mongodb";
import conexionDB from "../mongodb_conector.js";

/**
 * Usuarios
 */

export const getMarcas=async(req, res)=>{
    try {
        const database = await conexionDB();
        const collection = database.collection("marcas"); 
        const result = await collection.find({}).toArray();
        console.log(result);
        res.status(200).json(result); 
    } catch (error) {
        res.status(500).json({
            message:"Error en el servidor"
        })
    }
};

export const getMarca=async(req, res)=>{
    try {
        const {id}=req.params
        const database = await conexionDB();
        const collection = database.collection("marcas"); 
        const result = await collection.find({
            _id: new ObjectId(id),
          }).toArray();
        console.log(result);
        res.status(200).json(result[0]); 
    } catch (error) {
        res.status(500).json({
            message:"Error en el servidor"
        })
    }
};
