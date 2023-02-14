import { Bunbun } from '@nodi/bunbun';
import * as esbuild from 'esbuild';
import Utils from 'util';
import Sass from 'sass';
import { dtsPlugin } from 'esbuild-plugin-d.ts';

const $ = new Bunbun({});

$.fs.cwd = __dirname;

const extJs = $.task('ext/js', async () => {
    const pkg = JSON.parse(await $.fs.read('./package.json'));

    await $.fs.ensureDir('./build');
    await $.fs.ensureDir('./build/extension');

    await esbuild.build({
        entryPoints: [
            $.fs.resolve('./src/extension/devtools.ts'),
            $.fs.resolve('./src/extension/panel.tsx'),
            $.fs.resolve('./src/extension/background.ts'),
            $.fs.resolve('./src/extension/contentScript.ts'),
        ],
        outdir: $.fs.resolve('./build/extension'),
        bundle: true,
        minify: true,
        format: 'iife',
        treeShaking: true,
        keepNames: false,
        sourcemap: false,
        define: {
            SELF_VERSION: `"${pkg.version}"`,
        }
    });
});

const testJs = $.task('test/js', async () => {
    await $.fs.ensureDir('./build');
    await $.fs.ensureDir('./build/test');

    await esbuild.build({
        entryPoints: [
            $.fs.resolve('./src/test/index.tsx'),
        ],
        outdir: $.fs.resolve('./build/test'),
        bundle: true,
        minify: true,
        format: 'iife',
        treeShaking: true,
        keepNames: false,
        sourcemap: true,
    });
});

const buildModJs = async (dirname: string, format: 'esm' | 'cjs') => {
    await $.fs.remove(`./build/module/${dirname}`);

    await $.fs.ensureDir('./build');
    await $.fs.ensureDir('./build/module');
    await $.fs.ensureDir(`./build/module/${dirname}`);

    const entryPoints = await $.fs.list('./src/module/**/*.ts');

    await esbuild.build({
        entryPoints,
        outdir: $.fs.resolve(`./build/module/${dirname}`),
        bundle: false,
        minify: true,
        splitting: false,
        format,
        treeShaking: true,
        keepNames: true,
        platform: 'node',
        sourcemap: true,
        plugins: [
            dtsPlugin(),
        ],
    });
};

const modJsMjs = $.task('mod/js/mjs', async () => {
    await buildModJs('mjs', 'esm');
});

const modJsCjs = $.task('mod/js/cjs', async () => {
    await buildModJs('cjs', 'cjs');
});

const modJs = $.task('mod/js', async () => {
    await Promise.all([
        $.rescue(async () => {
            await $.run(modJsCjs);
        })(),
        $.rescue(async () => {
            await $.run(modJsMjs);
        })(),
    ]);
});

const testPublic = $.task('test/public', async () => {
    const filesToRemove = await $.fs.list(['./build/test/**/*.*', '!./**/*.{ts,tsx,js,css,scss,map}']);
    const filesToAdd = await $.fs.list(['./src/test/**/*.*', '!./**/*.{ts,tsx,js,css,scss}']);

    const filesCopyItems = filesToAdd.map(x => ({
        from: x,
        to: x.replace('./src/', './build/'),
    }));

    const dirsToEnsure = Array.from(new Set(filesCopyItems.map(x => x.to.replace(/\/.+?$/, ''))));

    await Promise.all(filesToRemove.map(x => $.fs.remove(x)));
    await Promise.all(dirsToEnsure.map(x => $.fs.ensureDir(x)));
    await Promise.all(filesCopyItems.map(x => $.fs.copy(x.from, x.to)));
});

const extPublic = $.task('ext/public', async () => {
    const filesToRemove = await $.fs.list(['./build/extension/**/*.*', '!./**/*.{ts,tsx,js,css,scss,map}']);
    const filesToAdd = await $.fs.list(['./src/extension/**/*.*', '!./**/*.{ts,tsx,js,css,scss}']);

    const filesCopyItems = filesToAdd.map(x => ({
        from: x,
        to: x.replace('./src/', './build/'),
    }));

    const dirsToEnsure = Array.from(new Set(filesCopyItems.map(x => x.to.replace(/\/.+?$/, ''))));

    await Promise.all(filesToRemove.map(x => $.fs.remove(x)));
    await Promise.all(dirsToEnsure.map(x => $.fs.ensureDir(x)));
    await Promise.all(filesCopyItems.map(x => $.fs.copy(x.from, x.to)));

    await $.run(manifest);
});

const extCss = $.task('ext/css', async () => {
    await $.fs.ensureDir('./build');
    await $.fs.ensureDir('./build/extension');

    const scssResult = await Utils.promisify(Sass.render)({
        file: $.fs.resolve('./src/extension/index.scss'),
        includePaths: [$.fs.resolve('./src/extension')],
        sourceMap: false,
        sourceMapContents: false,
        outFile: 'index.css',
        outputStyle: 'compressed',
    });

    if (!scssResult) {
        throw new Error('SCSS building result (object, css or map) is empty');
    }

    await $.fs.writeBuffer(
        $.fs.resolve('./build/extension/index.css'),
        scssResult.css,
    );
});

const manifest = $.task('manifest', async () => {
    const pkg = JSON.parse(await $.fs.read('./package.json'));
    const man = JSON.parse(await $.fs.read('./src/extension/manifest.json'));

    man.description = pkg.description;
    man.name = pkg.name;
    man.version = pkg.version;

    await $.fs.write('./build/extension/manifest.json', JSON.stringify(man));
});

const watch = $.task('watch', async () => {
    const safeExtCss = $.debouce($.rescue(async () => {
        await $.run(extCss);
    }));

    const safeExtJs = $.debouce($.rescue(async () => {
        await $.run(extJs);
    }));

    const safeModJs = $.debouce($.rescue(async () => {
        await $.run(modJs);
        await $.run(testJs);
    }));

    const safeTestJs = $.debouce($.rescue(async () => {
        await $.run(testJs);
    }));

    const safeExtPublic = $.debouce($.rescue(async () => {
        await $.run(extPublic);
    }));

    const safeTestPublic = $.debouce($.rescue(async () => {
        await $.run(testPublic);
    }));

    await $.rescue($.run)(extCss);
    await $.rescue($.run)(extJs);
    await $.rescue($.run)(modJs);
    await $.rescue($.run)(testJs);
    await $.rescue($.run)(extPublic);
    await $.rescue($.run)(testPublic);

    $.fs.watch('./src/extension/**/*.{scss,css}', safeExtCss);
    $.fs.watch('./src/extension/**/*.{ts,tsx,js}', safeExtJs);
    $.fs.watch('./src/module/**/*.{ts,tsx,js}', safeModJs);
    $.fs.watch('./src/test/**/*.{ts,tsx,js}', safeTestJs);
    $.fs.watch(['./src/test/**/*.*', '!./**/*.{ts,tsx,js}'], safeTestPublic);
    $.fs.watch(['./src/extension/**/*.*', '!./**/*.{ts,tsx,js}'], safeExtPublic);

    $.server.listen('./build/test');
});

const build = $.task('build', async () => {
    await Promise.all([
        $.run(extCss),
        $.run(extJs),
        $.run(extPublic),
    ]);
});

$.start(watch);
