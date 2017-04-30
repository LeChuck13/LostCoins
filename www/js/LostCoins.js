var map, sprite, moneda, logo, avion;
var tiempo, minutos, segundos, segundosPausas = 0;
var velocidadX = 0, velocidadY = 0;
var alto  = document.documentElement.clientHeight, ancho = document.documentElement.clientWidth;
var puntuacion = 0, pendingCoins, scoreText, coinText, layerText, timeText, layerLevel, textLevel = null, grd, grdPortada, grdAlert;
var niveles =  [{nombre: 'Level_1', desc: '- Level 1 -', coins: 28, reloj: 75},
                {nombre: 'Level_2', desc: '- Level 2 -', coins: 33, reloj: 90}];
var nivelActual = 0, numNiveles = 2;
var layer = [];
var currentLayer;
var game = new Phaser.Game(ancho, alto, Phaser.AUTO, 'joc', { preload: preload, create: create, update: update });

//  The Google WebFont Loader will look for this object, so create it before loading the script.
WebFontConfig = {
    //  'active' means all requested fonts have finished loading
    //  We set a 1 second delay before calling 'portada'.
    //  For some reason if we don't the browser cannot render the text the first time it's created.
    active: function() { game.time.events.add(Phaser.Timer.SECOND, portada, this); },
    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
      families: ['Revalia']
    }
};

if ('addEventListener' in document) {
    document.addEventListener('deviceready', function() {
        //  Load the Google WebFont Loader script
        game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
    },false);
}

function presenta() {
    FastClick.attach(document.body);
    portada();
    game.input.onTap.add(click, this); 
}

function portada() {
    logo = game.add.sprite(240, 100, 'coin');
    logo.scale.setTo(1.5, 1.5);
    logo.animations.add('rotar');
    logo.animations.play('rotar',10,true);
    logo.fixedToCamera = true;
    avion = game.add.sprite(120, 110, 'phaser');
    avion.scale.setTo(2, 2);
    avion.fixedToCamera = true;

    textPortada = game.add.text(ancho/2, 270, "Lost Coins®");
    textPortada.anchor.setTo(0.5);
    textPortada.font = 'Revalia';
    textPortada.fontSize = 70;

    //  x0, y0 - x1, y1
    grdPortada = textPortada.context.createLinearGradient(0, 0, 0, textPortada.canvas.height*2);
    grdPortada.addColorStop(0, '#A9E0FF');   
    grdPortada.addColorStop(1, '#004096');
    textPortada.fill = grdPortada;

    textPortada.align = 'center';
    textPortada.stroke = '#FFFFFF';
    textPortada.strokeThickness = 3;
    textPortada.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);
    textPortada.fixedToCamera = true;

    textAutor = game.add.text(ancho/2, 320, "© @LeChuck13");
    textAutor.anchor.setTo(0.5);
    textAutor.font = 'Revalia';
    textAutor.fontSize = 24;
    textAutor.fill = grdPortada;
    textAutor.align = 'center';
    textAutor.stroke = '#000000';
    textAutor.strokeThickness = 2;
    textAutor.fixedToCamera = true;

    textSteps = game.add.text(ancho/2, 450, "'Tap' for Start / Pause\n'Double Tap' for Reload");
    textSteps.anchor.setTo(0.5);
    textSteps.font = 'Revalia';
    textSteps.fontSize = 35;
    textSteps.fill = grdPortada;
    textSteps.align = 'center';
    textSteps.stroke = '#900030';
    textSteps.strokeThickness = 1;
    textSteps.fixedToCamera = true;
}

function click(pointer, doubleTap) {
    if (textPortada.visible) {
        textPortada.visible = false;
        logo.kill();
        avion.kill();
        textAutor.kill();
        textSteps.kill();
        layer[nivelActual].alpha = 1;
        navigator.accelerometer.watchAcceleration(onSucess,onError,{frequency: 10});
        game.time.reset();
        coinText.visible = true;
        timeText.visible = true;
        moneda.visible = true;
        scoreText.visible = true;
        sprite.visible = true;
        anuncioNivel();
    }
    else {
        if (doubleTap) {
            document.location.reload();
        }
        else {
            if(game.paused) {
                game.paused = false;
                segundosPausas = segundosPausas + Math.floor(game.time.pauseDuration/1000);
                tiempo = tiempo + segundosPausas;
            }
            else game.paused = true;
        }
    }
}

function onError(msg) {
    console.log('Error: ' + msg);
}

function onSucess(datosAceleracion) {
    velocidadX = datosAceleracion.x *-100;
    velocidadY = datosAceleracion.y * 100;
}

function preload() {
    game.load.tilemap('map', 'assets/tilemaps/maps/tile_collision_test.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('ground_1x1', 'assets/tilemaps/tiles/ground_1x1.png');
    game.load.image('phaser', 'assets/sprites/plane.png');
    game.load.spritesheet('coin', 'assets/sprites/coin.png', 32, 32);
}

function create() {
    var bucle;
    game.physics.startSystem(Phaser.Physics.ARCADE);

    map = game.add.tilemap('map');
    map.addTilesetImage('ground_1x1');
    map.addTilesetImage('coin');

    for(bucle = 0; bucle < numNiveles; bucle++){
        layer[bucle] = map.createLayer(niveles[bucle].nombre);
        currentLayer = layer[bucle];
        currentLayer.alpha = 0;
    }

    map.setCollisionBetween(1, 12, true, niveles[nivelActual].nombre);
    //  This will set Tile ID 26 (the coin) to call the hitCoin function when collided with
    map.setTileIndexCallback(26, hitCoin, this, niveles[nivelActual].nombre);
    //  This will set the map location 2, 0 to call the function
    map.setTileLocationCallback(2, 0, 0, 0, hitCoin, this);

    currentLayer = layer[nivelActual];
    currentLayer.alpha = 0;
    pendingCoins = niveles[nivelActual].coins;
    currentLayer.resizeWorld();
    layerText = map.createLayer('Textos');

    presenta();
    marcadores();

    sprite = game.add.sprite(50, 50, 'phaser');
    sprite.anchor.set(0.5);
    game.physics.enable(sprite);
    sprite.body.setSize(32, 32, -1, -8);
    //  We'll set a lower max angular velocity here to keep it from going totally nuts
    sprite.body.maxAngular = 500;
    //  Apply a drag otherwise the sprite will just spin and never slow down
    sprite.body.angularDrag = 50;
    game.camera.follow(sprite);
    sprite.visible = false;
}

function hitCoin(sprite, tile) {
    if(tile.alpha === 1) {
        pendingCoins = pendingCoins - 1;
        puntuacion = puntuacion + 10;
    }
    tile.alpha = 0.2;
    currentLayer.dirty = true;
    coinText.text = pendingCoins;
    scoreText.text = 'Score: ' + puntuacion;
    return false;
}

function update() {
    if (!textPortada.visible) {
        game.physics.arcade.collide(sprite, currentLayer);

        sprite.body.velocity.x = velocidadX;
        sprite.body.velocity.y = velocidadY;
        sprite.body.angularVelocity = 0;

        tiempo = (niveles[nivelActual].reloj) - game.time.totalElapsedSeconds() + 1 + segundosPausas;
        minutos = Math.floor(tiempo/60);
        segundos = Math.floor(tiempo)%60;

        if(pendingCoins === 0) {
            textLevel.text = 'Congrats\nBONUS TIME!';
            textLevel.fill = grdAlert;
            textLevel.visible = true;
            segundos = segundos + (minutos*60);
            while(segundos > 0){
                puntuacion = puntuacion + 15;
                scoreText.text = 'Score: ' + puntuacion;
                segundos = segundos - 1;
            }
            moneda.animations.stop(true);
            game.physics.destroy();
            cambioNivel();
        }
        else{
            if (minutos+segundos<=0) {
                textLevel.text = 'GAME OVER\nTIME OUT!';
                textLevel.fill = grdAlert;
                textLevel.visible = true;
                timeText.text='00:00';
                moneda.animations.stop(true);
                game.physics.destroy(sprite);
            } else {
                timeText.text=(segundos<10)?'0'+minutos+':0'+Math.floor(segundos):'0'+minutos+':'+Math.floor(segundos);
                if (tiempo<10) timeText.fill=grdAlert;
            }      
        }
    }
}

function render() {
    game.debug.body(sprite);
}

function marcadores() {
    // Monedas pendientes de recoger
    coinText = game.add.text(8, -2, pendingCoins, { fontSize: '32px' });
    coinText.stroke = '#000000';
    coinText.strokeThickness = 2;
    coinText.fixedToCamera = true;
    // Crea el degradado
    grd = coinText.context.createLinearGradient(0, 0, 0, coinText.canvas.height);
    grd.addColorStop(0, '#A9E0FF');   
    grd.addColorStop(1, '#004096');
    coinText.fill = grd;
    // Tiempo restante para pasar el nivel
    timeText = game.add.text(ancho-90, -2, '', { fontSize: '32px', fill: grd });
    timeText.stroke = '#000000';
    timeText.strokeThickness = 2;
    timeText.fixedToCamera = true;
    // Moneda en movimiento al lado de monedas pendientes
    moneda = game.add.sprite(47, 0, 'coin');
    moneda.animations.add('gira');
    moneda.animations.play('gira',10,true);
    moneda.fixedToCamera = true;
    // Puntuación acumulada
    scoreText = game.add.text(8, 541, 'Score: ' + puntuacion, { fontSize: '32px', fill: grd });
    scoreText.stroke = '#000000';
    scoreText.strokeThickness = 2;
    scoreText.fixedToCamera = true;

    coinText.visible = false;
    timeText.visible = false;
    moneda.visible = false;
    scoreText.visible = false;
}

function anuncioNivel() {
    textLevel = game.add.text(ancho/2, 280, niveles[nivelActual].desc);
    textLevel.anchor.setTo(0.5);
    textLevel.font = 'Revalia';
    textLevel.fontSize = 60;
    textLevel.fill = grdPortada;
    textLevel.align = 'center';
    textLevel.stroke = '#000000';
    textLevel.strokeThickness = 2;
    textLevel.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);
    textLevel.fixedToCamera = true;

    grdAlert = textLevel.context.createLinearGradient(0, 0, 0, textLevel.canvas.height*2);
    grdAlert.addColorStop(0, '#FF2020');   
    grdAlert.addColorStop(1, '#900000');
    game.time.events.add(1500, this.ocultaMensaje, this, textLevel);
}

function cambioNivel(){
    currentLayer.alpha = 0;
    nivelActual = nivelActual + 1;
    console.log('nivelActual: ' + nivelActual + 'cantidad: ' + numNiveles);
    if(nivelActual >= numNiveles){
        console.log('finished');
        textLevel.text = 'Más niveles\npróximamente';
        textLevel.fill = grdPortada;
        textLevel.align = 'center';
        textLevel.stroke = '#FFFFFF';
        textLevel.strokeThickness = 2;
        textLevel.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);
        textLevel.visible = true;
        sprite.visible = false;
        coinText.visible = false;
        moneda.visible = false;
        timeText.visible = false;
    }
    else{
        map.setCollisionBetween(1, 12, true, niveles[nivelActual].nombre);
        //  This will set Tile ID 26 (the coin) to call the hitCoin function when collided with
        map.setTileIndexCallback(26, hitCoin, this, niveles[nivelActual].nombre);
        //  This will set the map location 2, 0 to call the function
        map.setTileLocationCallback(2, 0, 0, 0, hitCoin, this);

        currentLayer = layer[nivelActual];
        currentLayer.alpha = 1
        currentLayer.resizeWorld();
        game.physics.startSystem(Phaser.Physics.ARCADE);
        layerText = map.createLayer('Textos');
        textLevel.text = niveles[nivelActual].desc;
        textLevel.fill = grdPortada;
        textLevel.visible = true;
        pendingCoins = niveles[nivelActual].coins;
        reactivaMarcadores();
        game.time.events.add(2000, this.ocultaMensaje, this, textLevel);
        sprite.x = 50;
        sprite.y = 50;
        game.paused = true;
        niveles[nivelActual].reloj = niveles[nivelActual].reloj + game.time.totalElapsedSeconds();
    }
}

function reactivaMarcadores() {
    coinText.text = pendingCoins;
    moneda.animations.play('gira',10,true);
}

function ocultaMensaje(msg) {
    msg.visible = false;
}