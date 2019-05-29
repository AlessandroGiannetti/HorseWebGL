"use strict";

var canvas;
var gl;
var program;

var i = 0;

var texSize = 256;
var numChecks = 16;

var fragTexType;
var c;

var projectionMatrix;
var modelViewMatrix;

//  =========================== INIT VIEW VALUES ===========================
var near = 1;
var far = 2000;
var FOV = 50.0;
var radius = 37.0;
var thetaView = 0.15;
var phi = 2.4;
var eye = vec3(radius * Math.sin(phi), radius * Math.sin(thetaView), radius * Math.cos(phi));
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

//  =========================== INIT ANIMATION VALUES ===========================
var animate = false;
//  =============== movement of body (angleWithGround up and right) ===============
var RightMovement = -12;
var UpMovement = 0;
var RotationMovement = 0;
var tailMovement = 0;
//  =============== movement of legs ===============
var rotateUpperFrontLeg = 0;
var rotateUpperBackLeg = 0;
var rotateLowerFrontLeg = 0;
var rotateLowerBackLeg = 0;
var rotateLegValue_FrontRight_BackLeft = 1.0;
var rotateLegValue_FrontLeft_BackRight = -1.0;
var rotateLowerLegValue_FrontRight_BackLeft = 2.0;
var rotateLowerLegValue_FrontLeft_BackRight = 2.0;
var legsMovementWalking = [0, 0, 0, 0];

var neckMovement = 0;
var headMovement = 0;
var earMovement = 0;
// =================================================================================

var instanceMatrix;
var modelViewMatrixLoc;

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];
// =========================== HORSE DATA ===========================
// =============== TORSO DATA ===============
// ID
var torsoId = 0;
// value
var torsoHeight = 4.5;
var torsoWidth = 2.2;
// =============== HEAD DATA ===============
// ID
var headId = 12;
// value
var headHeight = 2;
var headWidth = 0.9;

// =============== NECK DATA ===============
// ID
var neckId = 1;
// value
var neckHeight = 3.3;
var neckWidth = 1.15;
// =============== EAR DATA ===============
// ID
var earSxId = 18;
var earDxId = 19;
// value
var earWidth = 0.19;
var earHeight = 1.5;
// =============== LEG DATA ===============
//  ID Front leg
var leftUpperFrontLegId = 2;
var leftLowerFrontLegId = 3;
var rightUpperFrontLegId = 4;
var rightLowerFrontLegId = 5;
// value front leg
var upperFrontLegHeight = 2.5;
var lowerFrontLegHeight = 2.3;
var upperFrontLegWidth = 0.7;
var lowerFrontLegWidth = 0.5;
//  ID Back leg
var leftUpperBackLegId = 6;
var leftLowerBackLegId = 7;
var rightUpperBackLegId = 8;
var rightLowerBackLegId = 9;
// value back leg
var upperBackLegHeight = 2.5;
var upperBackLegWidth = 0.7;
// =============== TAIL DATA ===============
// id tail
var tailId = 11;
// value tail
var tailHeight = 2.5;
var tailWidth = 0.7;

// =========================== OBSTACLE DATA ===========================
// =============== id obstacle ===============
var HorizontalObstacle1Id = 13;
var HorizontalObstacle2Id = 14;
var HorizontalObstacle3Id = 15;
var VerticalObstacle1Id = 16;
var VerticalObstacle2Id = 17;

// =============== obstacle value ===============
var horizontalObstacleWidth = 0.3;
var horizontalObstacleHeight = 15;
var horizontalObstacle2Width = 1.2;
var horizontalObstacle2Height = 15;
var verticalObstacleWidth = 1.2;
var verticalObstacleHeight = 7;

// value for the init
var numNodesHorse = 15;
var numNodesObstacle = 6;

var theta = [90, -60, 90, 0, 90, 0, 110, -20, 110, -20, 0, -65, 30, 90, 90, 90, 90, 90, -50, -50];
var stack = [];

var horse = [];
var obstacle = [];

for (var i = 0; i < numNodesHorse; i++) horse[i] = createNode(null, null, null, null);
for (var i = 0; i < numNodesObstacle; i++) obstacle[i] = createNode(null, null, null, null);

var vBuffer;

var pointsArray = [];
var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

// =================================================================================
function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}

// =================================================================================
//checkBoard
var TcheckBoard = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        var patchx = Math.floor(i / (texSize / numChecks));
        var patchy = Math.floor(j / (texSize / numChecks));
        if (patchx % 2 ^ patchy % 2) c = 255;
        else c = 0;

        TcheckBoard[4 * i * texSize + 4 * j] = c;
        TcheckBoard[4 * i * texSize + 4 * j + 1] = c;
        TcheckBoard[4 * i * texSize + 4 * j + 2] = c;
        TcheckBoard[4 * i * texSize + 4 * j + 3] = 255;
    }
}
//checkBoard + gradation
var TcheckBoardDegr = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        var patchx = Math.floor(i / (texSize / numChecks));
        var patchy = Math.floor(j / (texSize / numChecks));
        if (patchx % 2 ^ patchy % 2) c = 255;
        else c = 0;

        TcheckBoardDegr[4 * i * texSize + 4 * j] = c*i;
        TcheckBoardDegr[4 * i * texSize + 4 * j + 1] = c*i;
        TcheckBoardDegr[4 * i * texSize + 4 * j + 2] = c*i;
        TcheckBoardDegr[4 * i * texSize + 4 * j + 3] = 255;
    }
}

function configTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
}

function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    };
    return node;
}


function initNodes(Id) {

    var m = mat4();

    switch (Id) {

        case torsoId:
            m = rotate(theta[torsoId], 0, 1, 0);
            m = mult(m, rotate(theta[torsoId], 1, 0, 0));
            m = mult(m, translate(9, -12 + RightMovement, -UpMovement, 0));
            m = mult(m, translate(-7.5, 0, 1, 0));
            m = mult(m, rotate(RotationMovement, 1, 0, 0));
            horse[torsoId] = createNode(m, torso, null, neckId);
            break;

        case neckId:
            m = translate(0.0, torsoHeight + 0.5 * neckHeight - 1.95, -neckHeight + 1.7);
            m = mult(m, rotate(theta[neckId] + neckMovement, 1, 0, 0));
            m = mult(m, translate(0.0, -0.5 * neckHeight, 0.0));
            horse[neckId] = createNode(m, neck, headId, null);
            break;

        case headId:
            m = translate(0.0, torsoHeight + neckHeight + 0.5 * neckHeight - 3.3, -neckHeight + 1.7);
            m = mult(m, rotate(theta[headId] + headMovement, 1, 0, 0));
            m = mult(m, translate(0.0, -0.5 * neckHeight, 0.0));
            horse[headId] = createNode(m, head, earSxId, null);
            break;

        case earSxId:
            m = translate(-neckWidth + 0.6, torsoHeight + neckHeight + 0.5 * neckHeight - earMovement - 4, -neckHeight - 0.7 - earMovement);
            m = mult(m, rotate(theta[earSxId], 1, 0, 0));
            m = mult(m, rotate(10 - earMovement, 0, 0, 1));
            m = mult(m, translate(0.0, -0.5 * neckHeight, 0.0));
            horse[earSxId] = createNode(m, ear, earDxId, null);
            break;

        case earDxId:
            m = translate(+neckWidth - 0.6, torsoHeight + neckHeight + 0.5 * neckHeight - earMovement - 4, -neckHeight - 0.7 - earMovement);
            m = mult(m, rotate(theta[earDxId], 1, 0, 0));
            m = mult(m, rotate(-10 + earMovement, 0, 0, 1));
            m = mult(m, translate(0.0, -0.5 * neckHeight, 0.0));
            horse[earDxId] = createNode(m, ear, leftUpperFrontLegId, null);
            break;

        case leftUpperFrontLegId:
            m = translate(-(upperFrontLegWidth + torsoWidth / 2 - 0.4), 0.9 * torsoHeight, 0.0);
            m = mult(m, rotate(theta[leftUpperFrontLegId], 1, 0, 0));
            m = mult(m, rotate(legsMovementWalking[0] + rotateUpperFrontLeg, 1, 0, 0));
            horse[leftUpperFrontLegId] = createNode(m, UpperLeg, rightUpperFrontLegId, leftLowerFrontLegId);
            break;

        case rightUpperFrontLegId:
            m = translate(upperFrontLegWidth + torsoWidth / 2 - 0.4, 0.9 * torsoHeight, 0.0);
            m = mult(m, rotate(theta[rightUpperFrontLegId], 1, 0, 0));
            m = mult(m, rotate(legsMovementWalking[1] + rotateUpperFrontLeg, 1, 0, 0));
            horse[rightUpperFrontLegId] = createNode(m, UpperLeg, leftUpperBackLegId, rightLowerFrontLegId);
            break;

        case leftUpperBackLegId:
            m = translate(-(upperBackLegWidth + torsoWidth / 2 - 0.4), 0.1 * upperBackLegHeight, 0.0);
            m = mult(m, rotate(theta[leftUpperBackLegId], 1, 0, 0));
            m = mult(m, rotate(legsMovementWalking[1] + rotateUpperBackLeg, 1, 0, 0));
            horse[leftUpperBackLegId] = createNode(m, UpperLeg, rightUpperBackLegId, leftLowerBackLegId);
            break;

        case rightUpperBackLegId:
            m = translate(upperBackLegWidth + torsoWidth / 2 - 0.4, 0.1 * upperBackLegHeight, 0.0);
            m = mult(m, rotate(theta[rightUpperBackLegId], 1, 0, 0));
            m = mult(m, rotate(legsMovementWalking[0] + rotateUpperBackLeg, 1, 0, 0));
            horse[rightUpperBackLegId] = createNode(m, UpperLeg, tailId, rightLowerBackLegId);
            break;

        case leftLowerFrontLegId:
            m = translate(0.0, upperFrontLegHeight, 0.0);
            m = mult(m, rotate(theta[leftLowerFrontLegId], 1, 0, 0));
            m = mult(m, rotate(legsMovementWalking[2] + rotateLowerFrontLeg, 1, 0, 0));
            horse[leftLowerFrontLegId] = createNode(m, LowerLeg, null, null);
            break;

        case rightLowerFrontLegId:
            m = translate(0.0, upperFrontLegHeight, 0.0);
            m = mult(m, rotate(theta[rightLowerFrontLegId], 1, 0, 0));
            m = mult(m, rotate(legsMovementWalking[3] + rotateLowerFrontLeg, 1, 0, 0));
            horse[rightLowerFrontLegId] = createNode(m, LowerLeg, null, null);
            break;

        case leftLowerBackLegId:
            m = translate(0.0, upperBackLegHeight, 0.0);
            m = mult(m, rotate(theta[leftLowerBackLegId], 1, 0, 0));
            m = mult(m, rotate(legsMovementWalking[3] + rotateLowerBackLeg, 1, 0, 0));
            horse[leftLowerBackLegId] = createNode(m, LowerLeg, null, null);
            break;

        case rightLowerBackLegId:
            m = translate(0.0, upperBackLegHeight, 0.0);
            m = mult(m, rotate(theta[rightLowerBackLegId], 1, 0, 0));
            m = mult(m, rotate(legsMovementWalking[2] + rotateLowerBackLeg, 1, 0, 0));
            horse[rightLowerBackLegId] = createNode(m, LowerLeg, null, null);
            break;

        case tailId:
            m = rotate(theta[tailId] + tailMovement, 1, 0, 0);
            m = mult(m, rotate(0, 0, 1, 0));
            m = mult(m, translate(0.0, -torsoHeight + 0.5 * tailHeight - 0.2, -0.2));
            m = mult(m, translate(0, 0.5 * tailHeight - 0.2, -0.2));
            horse[tailId] = createNode(m, tail, null, null);
            break;

        case HorizontalObstacle1Id:
            m = rotate(theta[HorizontalObstacle1Id], 0, 0, 1);
            m = rotate(theta[HorizontalObstacle1Id], 0, 1, 0);
            m = rotate(theta[HorizontalObstacle1Id], 1, 0, 0);
            m = mult(m, translate(0, 0.5 * verticalObstacleWidth-10, 0, 0));
            obstacle[HorizontalObstacle1Id] = createNode(m, HorizontalObstacleUp, null, VerticalObstacle1Id);
            break;

        case HorizontalObstacle2Id:
            m = rotate(theta[HorizontalObstacle2Id], 0, 0, 1);
            m = rotate(theta[HorizontalObstacle2Id], 0, 1, 0);
            m = rotate(theta[HorizontalObstacle2Id], 1, 0, 0);
            m = mult(m, translate(0, 0.5 * verticalObstacleWidth, -6.4, 0));
            obstacle[HorizontalObstacle2Id] = createNode(m, HorizontalObstacleDown2, HorizontalObstacle3Id, null);
            break;

        case HorizontalObstacle3Id:
            m = rotate(theta[HorizontalObstacle3Id], 0, 0, 1);
            m = rotate(theta[HorizontalObstacle3Id], 0, 1, 0);
            m = rotate(theta[HorizontalObstacle3Id], 1, 0, 0);
            m = mult(m, translate(0, 0.5 * verticalObstacleWidth, -3, 0));
            obstacle[HorizontalObstacle3Id] = createNode(m, HorizontalObstacleDown, null, null);
            break;

        case VerticalObstacle1Id:
            m = translate(0, -horizontalObstacleHeight / 4 + 3.4, -1.5);
            m = mult(m, rotate(theta[VerticalObstacle1Id], 1, 0, 0));
            obstacle[VerticalObstacle1Id] = createNode(m, VerticalObstacle, VerticalObstacle2Id, null);
            break;

        case VerticalObstacle2Id:
            m = translate(0, horizontalObstacleHeight + .4, -1.5);
            m = mult(m, rotate(theta[VerticalObstacle2Id], 1, 0, 0));
            obstacle[VerticalObstacle2Id] = createNode(m, VerticalObstacle, null, HorizontalObstacle2Id);
            break;

    }
}

// =================================================================================
function traverseHorse(Id) {
    if (Id == null) return;
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, horse[Id].transform);
    horse[Id].render();
    if (horse[Id].child != null) traverseHorse(horse[Id].child);
    modelViewMatrix = stack.pop();
    if (horse[Id].sibling != null) traverseHorse(horse[Id].sibling);
}

function traverseObstacle(Id) {
    if (Id == null) return;
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, obstacle[Id].transform);
    obstacle[Id].render();
    if (obstacle[Id].child != null) traverseObstacle(obstacle[Id].child);
    modelViewMatrix = stack.pop();
    if (obstacle[Id].sibling != null) traverseObstacle(obstacle[Id].sibling);
}

function torso() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

   //configTexture(TcheckBoard); // apply degradation texture for all faces starting from face 0
    for (var i = 0; i < 6; i++) {
        switch(i){
            case 2: // back of the torso
                fragTexType = 1;
                break;
            case 3: // front of the torso
                fragTexType = 2;
                configTexture(TcheckBoard);
                break;
            default: // sides of the torso
                fragTexType = 2;
                configTexture(TcheckBoardDegr);
                break;
        }
        gl.uniform1i(gl.getUniformLocation(program, "fragTexType"),fragTexType);
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
    }
    // delete texture for all the other elements
    gl.uniform1i(gl.getUniformLocation(program, "fragTexType"),1);
}

function neck() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * neckHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(neckWidth, neckHeight, neckWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function head() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function ear() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * earHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(earWidth, earHeight, earWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function UpperLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperFrontLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperFrontLegWidth, upperFrontLegHeight, upperFrontLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function LowerLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerFrontLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerFrontLegWidth, lowerFrontLegHeight, lowerFrontLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function tail() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function HorizontalObstacleDown() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * horizontalObstacleHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(horizontalObstacleWidth, horizontalObstacleHeight, horizontalObstacleWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function HorizontalObstacleDown2() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * horizontalObstacle2Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(horizontalObstacle2Width, horizontalObstacle2Height, horizontalObstacle2Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function HorizontalObstacleUp() {

    configTexture(TcheckBoard);
    gl.uniform1i(gl.getUniformLocation(program, "fragTexType"),fragTexType);
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * horizontalObstacleHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(horizontalObstacleWidth, horizontalObstacleHeight, horizontalObstacleWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
    gl.uniform1i(gl.getUniformLocation(program, "fragTexType"),2);
}

function VerticalObstacle() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * verticalObstacleHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(verticalObstacleWidth, verticalObstacleHeight, verticalObstacleWidth))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

// =================================================================================

function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    texCoordsArray.push(texCoord[0]);
    pointsArray.push(vertices[b]);
    texCoordsArray.push(texCoord[1]);
    pointsArray.push(vertices[c]);
    texCoordsArray.push(texCoord[2]);
    pointsArray.push(vertices[d]);
    texCoordsArray.push(texCoord[3]);
}

/**
 *     6 ------- 7
 *    / |       / |
 *   2 ------- 3  |
 *   |  |      |  |
 *   |  5 -----|- 4
 *   | /       | /
 *   1 ------- 0
 */
function cube() {
    quad( 3, 2,1, 0,); // bottom face
    quad( 7, 6,2, 3,); // dx face (view from front face)
    quad( 4, 7,3, 0,); // back face
    quad(2, 6, 5, 1); // front face
    quad( 4, 5,6, 7,); // top face
    quad( 0, 1,5, 4,); // sx face (view from front face)
}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // =================================================================================
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.viewport(0, 0, canvas.width, canvas.height);

    var aspect = canvas.width / canvas.height;

    gl.useProgram(program);

    instanceMatrix = mat4();

    projectionMatrix = perspective(FOV, aspect, near, far);
    modelViewMatrix = lookAt(eye, at, up);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    cube();

    vBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);


    document.getElementById("animate").onclick = function (event) {
        animate = !animate;
        // body initialization every time we click the button "animate"
        theta = [90, -60, 90, 0, 90, 0, 110, -20, 110, -20, 0, -65, 30, 90, 90, 90, 90, 90, -50, -50];

        legsMovementWalking[0] = 0;
        legsMovementWalking[1] = 0;
        legsMovementWalking[2] = 0;
        legsMovementWalking[3] = 0;

        rotateLegValue_FrontRight_BackLeft = 2.4;
        rotateLegValue_FrontLeft_BackRight = -2.4;
        rotateLowerLegValue_FrontRight_BackLeft = 2;
        rotateLowerLegValue_FrontLeft_BackRight = 2;

        rotateLowerFrontLeg = 0;
        rotateUpperFrontLeg = 0;
        rotateLowerBackLeg = 0;
        rotateUpperBackLeg = 0;

        neckMovement = 0;
        headMovement = 0;
        tailMovement = 0;
        earMovement = 0;

        RightMovement = -12;
        UpMovement = 0;
        RotationMovement = 0;
    };

    document.getElementById("Phi").oninput = function(event) {
        phi = this.valueAsNumber;
    };
    document.getElementById("Theta").oninput = function(event) {
        thetaView = this.valueAsNumber;
    };
    document.getElementById("R").oninput = function(event) {
        radius = this.valueAsNumber;
    };

    render();
};


function walkingAnimation() {
// =============== WALKING ANIMATION ===============
    if (RightMovement <= 0.8 || UpMovement <= 0) {
        // Legs animation
        legsMovementWalking[0] += rotateLegValue_FrontRight_BackLeft;
        legsMovementWalking[2] += rotateLegValue_FrontRight_BackLeft;
        if (legsMovementWalking[0] > 20) {
            rotateLegValue_FrontRight_BackLeft = -rotateLegValue_FrontRight_BackLeft;
            rotateLowerLegValue_FrontRight_BackLeft = -rotateLegValue_FrontRight_BackLeft;
        }
        if (legsMovementWalking[0] < -20) {
            rotateLegValue_FrontRight_BackLeft = -rotateLegValue_FrontRight_BackLeft;
            rotateLowerLegValue_FrontRight_BackLeft = -rotateLegValue_FrontRight_BackLeft;
        }

        legsMovementWalking[1] += rotateLegValue_FrontLeft_BackRight;
        legsMovementWalking[3] += rotateLegValue_FrontLeft_BackRight;
        if (legsMovementWalking[1] > 20) {
            rotateLegValue_FrontLeft_BackRight = -rotateLegValue_FrontLeft_BackRight;
        }
        if (legsMovementWalking[1] < -20) {
            rotateLegValue_FrontLeft_BackRight = -rotateLegValue_FrontLeft_BackRight;
        }

        //if (headMovement < 15) headMovement -= 1;
        //else headMovement += 1;
    }

}

function BeginJumpAnimation() {
    // =============== BEGIN JUMP ANIMATION ===============
    if (RightMovement > 2.30 && RightMovement <= 7) {
        RotationMovement -= 1.6;

        if (tailMovement < 70) tailMovement += 5;
        if (neckMovement < 36) neckMovement += 3;
        if (headMovement < 15) headMovement -= 1;
        if (earMovement < 0.1) earMovement -= 0.03;

        RightMovement += 0.05;
        UpMovement += 0.50;

        rotateUpperFrontLeg -= 5;
        rotateLowerFrontLeg += 10;

        rotateUpperBackLeg += 2.5;
        rotateLowerBackLeg += 1.5;
    }
}

function onAirAnimation() {
// =============== ON AIR JUMP ANIMATION ===============
    if (RightMovement > 7 && RightMovement < 16.5) {
        if (legsMovementWalking[0] !== 0) {
            if (legsMovementWalking[0] < 0) {
                legsMovementWalking[0] += 3;
                legsMovementWalking[2] += 3;
                legsMovementWalking[1] -= 3;
                legsMovementWalking[3] -= 3;
            }
            if (legsMovementWalking[0] > 0) {
                legsMovementWalking[0] -= 3;
                legsMovementWalking[2] -= 3;
                legsMovementWalking[1] += 3;
                legsMovementWalking[3] += 3;
            }
        }

        if (RightMovement > 7 && RightMovement < 9.5) {
            RightMovement += 0.1;
            RotationMovement -= 0.8;
        }
        if (RightMovement > 9.5 && RightMovement < 16.5) {
            RightMovement += 0.1;
            RotationMovement += 2;
        }

    }
}

function endJumpAnimation() {
// =============== JUMP OFF ANIMATION ===============
    if (RightMovement > 16.5 && UpMovement >= 0) {

        if (tailMovement > 0) tailMovement -= 5;

        if (neckMovement > 0) neckMovement -= 3;
        if (headMovement < 0) headMovement += 1;
        if (earMovement < 0) earMovement += 0.05;

        UpMovement -= 0.50;

        rotateUpperFrontLeg += 5;
        rotateLowerFrontLeg -= 10;

        rotateUpperBackLeg -= 2.5;
        rotateLowerBackLeg -= 1.5;

        if (RightMovement > 15.5 && RightMovement <= 20) {
            RotationMovement += 2.2;
        }
    }
    if (RightMovement > 20 && RotationMovement > 0) {
        RotationMovement -= 3;
    }
}

function restartAnimation() {
// =============== RESTART ANIMATION ===============
    if (RightMovement > 38) {
        RotationMovement = 0;
        RightMovement = -12;
    }
}

function animation() {
    RightMovement += 0.23;

    walkingAnimation();

    BeginJumpAnimation();

    onAirAnimation();

    endJumpAnimation();

    restartAnimation();
}


var render = function () {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(phi), radius * Math.sin(thetaView), radius * Math.cos(phi));
    modelViewMatrix = lookAt(eye, at, up);

    for (i = 0; i < numNodesHorse + numNodesObstacle; i++) initNodes(i);
    if (animate) animation();
    traverseHorse(torsoId);
    traverseObstacle(HorizontalObstacle1Id);
    requestAnimFrame(render);
};
