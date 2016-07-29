// Generated by typings
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/90dc1f65a2ffa5125ced3d64ef5ba06262ac7ee7/archiver/archiver.d.ts
declare module "archiver" {
    import * as FS from 'fs';
    import * as STREAM from 'stream';
    
    interface nameInterface {
        name?: string;
    }
        
    interface Archiver extends STREAM.Transform {
        pipe(writeStream: FS.WriteStream): void;
        append(source: FS.ReadStream | Buffer | string, name: nameInterface): void;
        finalize(): void;
    }
    
    interface Options {
        
    }
    
    function archiver(format: string, options?: Options): Archiver;
    
    namespace archiver {
        function create(format: string, options?: Options): Archiver;
    }
    
    export = archiver;
}
