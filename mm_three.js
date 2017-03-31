// Copyright (c) 2016 Juan Carlos Orozco Arena
// Author: Juan Carlos Orozco
// License: Apache 2.0

var mm_camera, mm_scene, mm_renderer;
var mm_geometry, mm_material, mm_mesh, mm_font;
var mm_controls, mm_clock, mm_ambient;

var mm_grid, mm_axis;
var mm_play_init, mm_play_close, mm_animation;

var mm_draw; // Placeholder for draw function
var mm_loading = {"cnt": 0, "iterations": 0}; // Counter for pending loading assets.

var mm_assets_objects = {
  //"renderer":{},
  //"scene":{},
  //"camera":{}
}; // Add dictionary with more data to each asset (ex. geometry, file info, etc)

var mm_assets_textures = {
};

var mm_assets_functions = {
};

//var mm_zip;
THREE.Object3D.prototype.setScale = function(v){
  this.scale.set(v[0],v[1],v[2]);
  //this.updateMatrix();
  return this;
}

THREE.Object3D.prototype.setTranslation = function(v){
  this.position.set(v[0],v[1],v[2]);
  return this;
}

THREE.Object3D.prototype.setRotation = function(v){
  this.rotation.set(v[0]*Math.PI/180.0,v[1]*Math.PI/180.0,v[2]*Math.PI/180.0);
  //this.rotation.set(v[0],v[1],v[2]);
  return this;
}


// THREE.Object3D.prototype.setScale = function(v){
//   var v3 = new THREE.Vector3(v[0],v[1],v[2]);
//   var m1 = new THREE.Matrix4();
//   m1.scale(v3);
//   this.matrix.multiply( m1 );
//   return this;
// }
//
// THREE.Object3D.prototype.setTranslation = function(v){
//   var m1 = new THREE.Matrix4();
//   m1.makeTranslation(v[0],v[1],v[2]);
//   this.matrix.multiply( m1 );
//   return this;
// }
//
// THREE.Object3D.prototype.setRotation = function(v){
//   var m1 = new THREE.Matrix4();
//   var m2 = new THREE.Matrix4();
//   var m3 = new THREE.Matrix4();
//   //var e1 = new THREE.Euler(v[0],v[1],v[2],'XYZ');
//   //m1.makeRotationFromEuler(v);
//   var d2r = Math.PI/180; // Use to convert degrees to radians
//   m1.makeRotationX( v[0]*d2r );
//   m2.makeRotationY( v[1]*d2r );
//   m3.makeRotationZ( v[2]*d2r );
//   this.matrix.multiply(m1);
//   this.matrix.multiply(m2);
//   this.matrix.multiply(m3);
//   return this;
// }

THREE.Object3D.prototype.addMeshList = function(mesh_list){
  for(var i=0; i<mesh_list.length; i++){
    this.add(mesh_list[i]);
  }
  return this;
}



THREE.Object3D.prototype.setColor = function(c){
  var _setColor = function(children) {
    for(var i=0; i<children.length; i++){
      children[i].setColor(c);
      _setColor(children[i].children);
    }
  }
  _setColor(this.children);
  //if(this.children.length>0){
  //  for(i=0; i<this.children.length; i++){
  //    //this.children[i].material.color = c;
  //    this.children[i].setColor(c);
  //  }
  //}
  return this;
}

// JCOA TODO Improve this function, check if material is MeshLambertMaterial and just change color otherwise ignore change.
THREE.Mesh.prototype.setColor = function(c){
  //this.material.color = c; // This does not work. Why?

  this.material = new THREE.MeshLambertMaterial( { color: c, wireframe:  mm_three_toolbar.wireframe, wireframeLinewidth: 1 } );
  return this;
}

THREE.Object3D.prototype.setTexture = function(url){
  var _setTexture = function(children) {
    for(var i=0; i<children.length; i++){
      children[i].setTexture(url);
      _setTexture(children[i].children);
    }
  }
  _setTexture(this.children);
  //if(this.children.length>0){
  //  for(i=0; i<this.children.length; i++){
  //    //this.children[i].material.color = c;
  //    this.children[i].setColor(c);
  //  }
  //}
  return this;
}

// JCOA TODO Improve this function, check if material is MeshLambertMaterial and just change texture otherwise ignore change.
THREE.Mesh.prototype.setTexture = function(texture){
  //var texture = new THREE.TextureLoader().load( url );
  if(typeof this.material == "undefined"){
    this.material = new THREE.MeshLambertMaterial( { map: texture } );
  }
  else{
    this.material.map = texture;
  }
  return this;
}

THREE.Object3D.prototype.setMaterial = function(material){
  var _setMaterial = function(children) {
    for(var i=0; i<children.length; i++){
      children[i].setMaterial(url);
      _setMaterial(children[i].children);
    }
  }
  _setMaterial(this.children);
  //if(this.children.length>0){
  //  for(i=0; i<this.children.length; i++){
  //    //this.children[i].material.color = c;
  //    this.children[i].setColor(c);
  //  }
  //}
  return this;
}

THREE.Mesh.prototype.setMaterial = function(material){
  this.material = material;
  return this;
}

// JCOA: This modifier can not be applied recursively. How can we avoid replicating the mesh every time this modifier is called.
//   watch for memory leaks
THREE.Mesh.prototype.setSubdivisions = function(subdivisions){
  var modifier = new THREE.SubdivisionModifier( subdivisions );

  //this.geometry.mergeVertices();
  //this.geometry.computeFaceNormals();
  //this.geometry.computeVertexNormals();

  modifier.modify( this.geometry );
  return this;
}

var mm_new_mesh = function(geometry, material){
  if(typeof(material) === 'undefined'){
    material = mm_material.clone();
  }
  var m = new THREE.Mesh(geometry, material);
  m.matrixAutoUpdate = true; // Without this setting the transforms do not work.
  return m;
}

// TODO: Just proof of concept for PhysiJS. Check how to include other types of meshes
// TODO: Set a variable to identify that physijs is executing. Change 2 blocks for one and check for physijs mode
var mm_new_physi_mesh = function(mesh, mass, friction, bounce){
  // if(typeof(material) === 'undefined'){
  //   material = mm_material.clone();
  // }
  if(typeof(mass) === 'undefined'){
    mass = 1;
  }
  mesh.updateMatrix();
  var material = Physijs.createMaterial(mesh.material, friction, bounce);
  var geometry = new THREE.Geometry();
  geometry.merge(mesh.geometry, mesh.matrix);

  //var m = new Physijs.BoxMesh(geometry, material, 1); // geometry, material, mass
  // Esto no funciono:
  //var m = new Physijs.Mesh(geometry, material, 1); // TODO: Add mass according to volume. (What happens with scale to the mass)
  var m = new Physijs.ConvexMesh(geometry, material, mass);

  m.matrixAutoUpdate = true; // Without this setting the transforms do not work.
  return m;
}

var mm_set = function(object3d){
  object3d.matrixAutoUpdate = true; // Without this setting the transforms do not work.
  //object3d.matrixWorld = false; // Without this setting the transforms do not work. // still doest work with pointlight and setlightshadow
  return object3d;
}

var mm_text2mesh = function(text, font, size, height, curveSegments, material){
  var geometry = new THREE.TextGeometry( text, {
					font: font,
					size: size,
					height: height,
					curveSegments: curveSegments
				});
  return mm_new_mesh(geometry, material);
}

var mm_polygon = function(arr){
  var list = [];

  for(var i=0; i<arr.length; i++){
    list.push(new THREE.Vector2(arr[i][0], arr[i][1]));
  }
  //console.log(list);
  return list;
}

var mm_extrude = function(polygon, height, segments, twist){
  segments = segments || 1
  twist = twist || 0
  
  var _angle = function(z, k){
    return k*z*Math.PI*2
  }

  var _rotate = function(v, k){
    var angle = _angle(v.z, k)
    console.log(angle)
    var x = v.x*Math.cos(angle) - v.y*Math.sin(angle)
    var y = v.x*Math.sin(angle) + v.y*Math.cos(angle)
    return new THREE.Vector3(x,y,v.z)
  }

  var _twist = function(g, k){
    //var g2 = g.clone();
    var i = 0
    for(let v of g.vertices){
        //g2.vertices[i] = _rotate(v, k)
        g.vertices[i] = _rotate(v, k)
        i += 1
    }
    //return g2
  }
  
  var shape = new THREE.Shape(polygon);
  var extrudeSettings1 = {
      bevelEnabled: false,
      steps: segments,
      amount: height
  };

  var geometry1 = new THREE.ExtrudeGeometry( shape, extrudeSettings1 );
  _twist(geometry1, twist/(height*360.0))
  return mm_new_mesh(geometry1);
}

var mm_cylinder = function(diameter1, diameter2, height, sides, heightSegments){
  var objectGeometry = new THREE.CylinderGeometry(diameter1/2, diameter2/2, height, sides, heightSegments);
  objectGeometry.rotateX(Math.PI/2);
  return mm_new_mesh(objectGeometry);
}

var mm_lathe = function(polygon, divisions, closed){
  var len = polygon.length;
  if((polygon[0].x == polygon[len-1].x) && (polygon[0].y == polygon[len-1].y)){
  }
  else{
    if(closed){
      polygon.push(polygon[0]);
    }
  }
  var geometry = new THREE.LatheGeometry(polygon,divisions);
  return mm_new_mesh(geometry);
}

var mm_spiral = function(height, segments, angle_z, radius_z){
  var points = [];
  var dz = height/segments;
  var angle, radius;
  var x, y, z;
  for(var i=0; i<segments; i++){
    z = dz*i;
    angle = angle_z(z);
    radius = radius_z(z);
    x = radius*Math.sin(angle);
    y = radius*Math.cos(angle);
    points.push(new THREE.Vector3(x, y, z));
  }
  //console.log(points);
  return points;
}

var mm_extrude_path = function(polygon, path, divisions, closed){
  // var divisions = 50;
  var shape = new THREE.Shape(polygon);

  var vlist = [];
  var points = path; // path.extractPoints(divisions).shape;
  // TODO: JCOA Check if there is a method in Curve to create a curve from points.
  var len = points.length;
  if(closed){
    if((points[0].x == points[len-1].x) && (points[0].y == points[len-1].y)){
      len = len-1;
    }
    var x_mid = (points[0].x + points[len-1].x)/2;
    var y_mid = (points[0].y + points[len-1].y)/2;
    vlist.push(new THREE.Vector3(x_mid, y_mid, 0));
    for(var i=0; i<len; i++){
      vlist.push(new THREE.Vector3(points[i].x, points[i].y, points[i].z || 0));
    }
    vlist.push(new THREE.Vector3(x_mid, y_mid, 0));
  }
  else{
    for(var i=0; i<len; i++){
      vlist.push(new THREE.Vector3(points[i].x, points[i].y, points[i].z || 0));
    }
  }
  //console.log(vlist);

  //var path3 = new THREE.CatmullRomCurve3( vlist );
  var path3 = new THREE.SplineCurve3( vlist );
  
  var extrudeSettings = {
      bevelEnabled: false,
      steps: divisions, // Number of subdivisions of the extrude
      extrudePath: path3
  };
  var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
  return mm_new_mesh(geometry);
}

// JCOA Implementation on extrude path using a normal extrude as starter, use each extrude unit as an index and then addapt each polygon to their corresponding path point. Use the previous and nest path points to calculate an average angle that will be used to place the polygon. Do not rotate the poligon on the other axis (define other axis)
var mm_extrude_path2 = function(polygon, path, divisions){
}

var mm_merge_geometry  = function(object){
  var geometry = new THREE.Geometry();
  var objectGeometry = object.geometry;
  if(object.geometry instanceof THREE.BufferGeometry){
    objectGeometry = new THREE.Geometry().fromBufferGeometry( object.geometry );
  }
  if(typeof object.geometry != "undefined"){
    object.updateMatrixWorld();
    // TODO: Test if this change worked
    //geometry.merge(object.geometry, object.matrix); // No
    geometry.merge(objectGeometry, object.matrixWorld);
    //geometry = objectGeometry; // No
  }
  var _mergeGeometry = function(children) {
    for(var i=0; i<children.length; i++){
      if(typeof children[i].geometry != "undefined"){
        var g;
        children[i].updateMatrixWorld();
        var matrixWorld = children[i].matrixWorld;
        if(children[i].geometry instanceof THREE.BufferGeometry){
          g = new THREE.Geometry().fromBufferGeometry( children[i].geometry );
          matrixWorld = object.matrixWorld;
        }
        else{
          g = children[i].geometry;
          //var clone = children[i].clone();
          //g = clone.geometry;
          //matrixWorld = clone.matrixWorld;
        }
        // TODO: Test the consequences of this change.
        // Maybe multiply object.matrix times children[i].matrix
        //geometry.merge(g, children[i].matrixWorld);
        geometry.merge(g, matrixWorld);
        //applyMatrix( matrix );
        //t/geometry.merge(g, object.matrix);
      }
      _mergeGeometry(children[i].children);
    }
  }
  _mergeGeometry(object.children);

  return geometry;
}

var mm_boolean_op = function(operation, block1, block2){
  // TODO: Check for leaks because we are using new each time we refresh this operation.
  // TODO: Enable this to work with complex parts (with children, grandchildren etc.) recursively. Check setScale for an example.
  var ret;
  // TODO: Get material from first nonvirtual mesh.

  var normalize_part = function(block){
    var block_clone;
    block.updateMatrix();
    block.updateMatrixWorld();
    var matrix = block.matrix;
    block_clone = block.clone();
    var material = mm_material.clone();
    if(typeof block_clone.material != "undefined"){
      material = block_clone.material.clone();
    }
    //t/ block_clone.geometry.applyMatrix( matrix );
    //t/ block_clone.applyMatrix( matrix );
    var geometry = mm_merge_geometry(block_clone);
    //if(typeof block_clone.geometry !== "undefined"){
    //  block_clone.geometry = block_clone.geometry.clone(); // JCOA: block.clone() does not clone the geometry.
    // block_clone.matrixAutoUpdate = true;
    // block_clone.updateMatrix();
    // block_clone.geometry = geometry;
    // block_clone.geometry.applyMatrix(matrix); // Worked! Check if block has geometry ...

    //var geometry2 = block_clone.geometry;
    //}
    //else{
    //  block_clone.geometry = geometry;
    //  block_clone.applyMatrix(matrix);
    //}
    //if(block_clone.geometry instanceof THREE.BufferGeometry){
    //  block_clone = mm_new_mesh(new THREE.Geometry().fromBufferGeometry( block_clone.geometry ));
    //}
    return mm_new_mesh(geometry, material);
    //return mm_new_mesh(geometry2, material);
  }
  //console.log("Test type:");
  //console.log(block1.geometry instanceof THREE.BufferGeometry);
  //console.log(block1.geometry instanceof THREE.Geometry);

  var block1b = normalize_part(block1);
  var block2b = normalize_part(block2);
  var material = block1b.material;
  // var matrix1 = block1.matrix;
  // block1b = block1.clone();
  // var material = block1b.material;
  // block1b.geometry.applyMatrix(matrix1); // Worked! Check if block has geometry ...
  // if(block1b.geometry instanceof THREE.BufferGeometry){
  //   block1b = mm_new_mesh(new THREE.Geometry().fromBufferGeometry( block1b.geometry ));
  // }
  // var matrix2 = block2.matrix;
  // block2b.geometry.applyMatrix(matrix2);
  // if(block2b.geometry instanceof THREE.BufferGeometry){
  //   block2b = mm_new_mesh(new THREE.Geometry().fromBufferGeometry( block2b.geometry ));
  // }
  switch(operation){
    case "subtract":
      ret = mm_set((new ThreeBSP(block1b.geometry))
            .subtract(new ThreeBSP(block2b.geometry))
            .toMesh(material)); // mm_material.clone()));
      break;
    case "intersect":
      ret = mm_set((new ThreeBSP(block1b.geometry))
            .intersect(new ThreeBSP(block2b.geometry))
            .toMesh(material));
      break;
    case "union":
      ret = mm_set((new ThreeBSP(block1b.geometry))
            .union(new ThreeBSP(block2b.geometry))
            .toMesh(material));
      break;
  }
  return ret;
}

var mm_objloader = function(url){
  var loader = new THREE.OBJLoader();
  //http://threejs.org/docs/#Reference/Core/Geometry
  //var geometry = new THREE.Geometry();
  //var geometry = new THREE.SphereGeometry( 0.001, 4, 4 ); // JCOA Hack: Works as an invisible point.
  //geometry.vertices.push(new THREE.Vector3( 0,  0, 0 ));
  //mm_mesh = mm_new_mesh(geometry);
  mm_group = new THREE.Object3D();
  //mm_group.add(mm_mesh);

  mm_loading.cnt += 1;
  // load a resource
  loader.load(
    // resource URL
    url,
    // Function when resource is loaded
    function ( object ) {
      console.log("Finish loading");
      //mm_group.add(object);
      mm_group.add(mm_new_mesh(object));
      //mm_scene.add(object);
      //mm_mesh.add(object);
      //mm_mesh.geometry.dynamic = true;
      //mm_mesh.geometry = object.geometry; // mesh.geometry.vertices = theObjects[i].geo.vertices;
      //mm_mesh.material = object.material;
      //mm_mesh.geometry.verticesNeedUpdate = true;
      mm_loading.cnt -= 1;
    },
    function(progress){
    },
    function (err) {
      console.log(err);
      mm_loading.cnt -= 1;
    }
  );
  // JCOA: This is not working (creates and infinite loop)
  // The reason being that while this code (no real sleep in js because it is single threaded)
  //   the loader code can not execute.
  //while(finish==false){
  //  console.log("finish: "+finish);
  //}
  //return loadHelper.ret;

  //return mm_mesh;
  return mm_group;
}

var mm_stlloader = function(url){
  var loader = new THREE.STLLoader();
  //http://threejs.org/docs/#Reference/Core/Geometry
  //var geometry = new THREE.Geometry();
  //var geometry = new THREE.SphereGeometry( 0.001, 4, 4 ); // JCOA Hack: Works as an invisible point.
  //geometry.vertices.push(new THREE.Vector3( 0,  0, 0 ));
  //mm_mesh = mm_new_mesh(geometry);
  mm_group = new THREE.Object3D(); // This is the new way of creating groups.
  //mm_group.add(mm_mesh);

  mm_loading.cnt += 1;
  // load a resource
  loader.load(
    // resource URL
    url,
    // Function when resource is loaded
    function ( object ) {
      console.log("Finish loading");
      //mm_group.add(object);
      mm_group.add(mm_new_mesh(object));
      //mm_scene.add(object);
      //mm_mesh.add(mm_new_mesh(object));
      //mm_mesh.geometry.dynamic = true;
      //mm_mesh.geometry = object.geometry; // mesh.geometry.vertices = theObjects[i].geo.vertices;
      //mm_mesh.material = object.material;
      //mm_mesh.geometry.verticesNeedUpdate = true;
      mm_loading.cnt -= 1;
    },
    function(progress){
    },
    function (err) {
      console.log(err);
      mm_loading.cnt -= 1;
    }
  );
  // JCOA: This is not working (creates and infinite loop)
  // The reason being that while this code (no real sleep in js because it is single threaded)
  //   the loader code can not execute.
  //while(finish==false){
  //  console.log("finish: "+finish);
  //}
  //return loadHelper.ret;

  //return mm_mesh;
  return mm_group;
}

var mm_waitLoading = function(){
  // TODO: JCOA Maybe add this delay time and timeout as configurable option
  if(mm_loading.cnt > 0){
    if(mm_loading.iterations < 80){ // Timeout iterations * delay
      //console.log(mm_loading.iterations);
      mm_loading.iterations += 1;
      setTimeout( mm_waitLoading, 100 ); // Delay in ms
    }
    else{
      console.log("Loading timeout");
      mm_loading.iterations = 0;
    }
  }
  else{
    mm_loading.iterations = 0;
    mm_loading.cnt = 0;
    mm_draw();
  }
}

var crossBrowserInit = function(){
  /**
  * Provides requestAnimationFrame/cancelRequestAnimation in a cross browser way.
  * from paul irish + jerome etienne
  * - http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  * - http://notes.jetienne.com/2011/05/18/cancelRequestAnimFrame-for-paul-irish-requestAnimFrame.html
  */
  if ( !window.requestAnimationFrame ) {
  	window.requestAnimationFrame = ( function() {
  		return window.webkitRequestAnimationFrame ||
  		window.mozRequestAnimationFrame ||
  		window.oRequestAnimationFrame ||
  		window.msRequestAnimationFrame ||
  		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
  			return window.setTimeout( callback, 1000 / 60 );
  		};
  	} )();
  }

  if ( !window.cancelRequestAnimationFrame ) {
  	window.cancelRequestAnimationFrame = ( function() {
  		return window.webkitCancelRequestAnimationFrame ||
  		window.mozCancelRequestAnimationFrame ||
  		window.oCancelRequestAnimationFrame ||
  		window.msCancelRequestAnimationFrame ||
  		clearTimeout
  	} )();
  }
}

var initThreejs = function (font) {
  crossBrowserInit();
  mm_font = font;

  if ( Detector.webgl )
		mm_renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		mm_renderer = new THREE.CanvasRenderer();
	//mm_renderer = new THREE.WebGLRenderer( {antialias:true} );
  var three_div = document.getElementById("three");
  var three_container = document.getElementById("three-container");
  //mm_renderer.setSize( window.innerWidth, 0.43*window.innerHeight );
  mm_renderer.setSize( three_container.clientWidth, three_container.clientHeight );
  //mm_renderer.setSize( 300, 300 );
  mm_renderer.setClearColor(0x141414);

  three_div.appendChild( mm_renderer.domElement );

//if (mm_three_toolbar.orthografic){
  //mm_camera = new THREE.PerspectiveCamera( 60, window.innerWidth / (window.innerHeight), 1, 1000 ); //60 was 75
  //mm_camera = new THREE.CombinedCamera( window.innerWidth / 2, window.innerHeight / 2, 70, 1, 1000, - 500, 1000 );
//else {
  mm_camera = new THREE.OrthographicCamera( three_container.clientWidth / - 2, three_container.clientWidth / 2, three_container.clientHeight / 2, three_container.clientHeight / - 2, 1, 1000 );
//}
  //t/mm_camera = new THREE.PerspectiveCamera( 75, box2.clientWidth / (box2.clientHeight), 1, 1000 );
  //mm_camera = new THREE.OrthographicCamera( three_container.clientWidth / - 2, three_container.clientWidth / 2, three_container.clientHeight / 2, three_container.clientHeight / - 2, 1, 1000 );
  //mm_camera.position.z = 500;
  mm_camera.position.y = 200;
  mm_camera.position.x = 200;
  mm_camera.position.z = 100;
  mm_camera.up = new THREE.Vector3( 0, 0, 1 ); // Turn camera so z axis points up
  mm_camera.lookAt(new THREE.Vector3( 0, 0, 0 ));

  mm_clock = new THREE.Clock();
  mm_controls = new THREE.OrbitControls( mm_camera, mm_renderer.domElement );
  mm_ambient = new THREE.AmbientLight( 0x808080 );
  mm_scene = new THREE.Scene();
  mm_axis = new THREE.AxisHelper( 50 );
  //mm_scene.add( mm_ambient );

  mm_grid = new THREE.GridHelper(200,20);
  mm_grid.geometry.rotateX( Math.PI / 2 );

  //mm_geometry = new THREE.CubeGeometry( 100, 100, 100 );
  mm_material = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, wireframe:  mm_three_toolbar.wireframe, wireframeLinewidth: 1 } );

  //mm_mesh = new THREE.Mesh( mm_geometry, mm_material );
  //mm_scene.add( mm_mesh );

  // mm_mesh.setScale([2,1,1]).setRotation([45*Math.PI/180,23*Math.PI/180,0]);
  // cubef is not working as expected.
  //var mesh2 = mm_mesh.cubef([100,100,100]).setScale([2,1,1]).setRotation([45*Math.PI/180,0,0]).setTranslation([50,0,0]).setColourf(0xFF0000);
  //mm_scene.add(mesh2);
  ///mm_mesh.setScale([2,1,1]).setRotation([45*Math.PI/180,0,0]).setTranslation([50,0,0]).setColourf(0xFF0000);

  //mm_mesh.setScale([2,1,1]).setRotation([45*Math.PI/180,0,0]).setTranslation([50,0,0]).setColourf(0x00FF00);
  //mm_mesh.matrixAutoUpdate = false
  //mm_scene.add((new THREE.Mesh(new THREE.SphereGeometry( 100, 100, 100 ), mm_material.clone())).setTranslation([-50,0,0]).setColourf(0x0000FF));
  //mm_scene.add((mm_mesh = new THREE.Mesh(new THREE.SphereGeometry( 100, 100, 100 ), mm_material.clone())).setTranslation([-50,0,0]).setColourf(0x0000FF));

}

var animationDelay = function(){
  // TODO: Poner los ms como parámetro configurable avanzado cuando tengamos sistema de configuración.
  var delay=100; //ms JCOA: Delay de tiempo como solución para evitar exceso de uso de recursos.
  setTimeout(animate, delay);
}

// TODO: Llamar update o animate con un delay para que no use tantos recursos de CPU.
var animate = function () {
  requestAnimationFrame( animationDelay );

  // The next instructions only work if updateMatrix is executed or matrixAutoUpdate is true.
  //mm_mesh.rotation.x = 45*Math.PI/180;
  //mm_mesh.rotation.y = 0;

  //var v = new THREE.Vector3(1,1,1);

  //mm_mesh.matrix.makeRotationX(45*Math.PI/180).scale(v.set(1.5,1,1));
  // We will now only animate from play-dialog
  if(mm_state.animate){
    if(typeof(mm_animation)==='function'){
      mm_animation(); // mm_clock.getDelta()
    }
  }

  if(mm_state.animate){
    if(typeof mm_scene.simulate == "function"){
      mm_scene.simulate();
    }
  }
  mm_renderer.render( mm_scene, mm_camera );
  updateThreejs();
}

var updateThreejs = function () {
  // https://stemkoski.github.io/Three.js/Mesh-Movement.html
  if(mm_state.animate == false){
    mm_controls.update();
  }
}

THREE.Object3D.prototype.setShadow = function(cast, receive){
 this.castShadow = cast;
 this.receiveShadow = receive;
 return this;
}

THREE.Object3D.prototype.setLightShadow = function(cast, shadowresolution, camerafar, isdirectional, camerasize, camerahelper){
  this.castShadow = cast;
  //this.shadowDarkness = darkness; has been removed from three.js use directional light instead
  this.shadow.mapSize.width = shadowresolution;
  this.shadow.mapSize.height = shadowresolution;
  this.shadow.camera.far = camerafar;
  // if (camerahelper==true){
  //   var camhelper = new THREE.CameraHelper (this.shadow.camera); // this helps see where the camera is before this.shadow.camera()
  //   mm_scene.add(camhelper);
  // }
  var that=this;
  console.log(that.id);
  if (camerahelper==true){
    if (isdirectional==true){
      var camhelper = new THREE.DirectionalLightHelper( that , 10); // this helps see where the camera is
      mm_scene.add(camhelper);
    }
    else{
      var camhelper = new THREE.PointLightHelper( that ,2); // this helps see where the camera is
      mm_scene.add(camhelper);
    }
  }
  if (isdirectional = true){
    this.shadow.camera.left = -camerasize;
    this.shadow.camera.right = camerasize;
    this.shadow.camera.top= -camerasize;
    this.shadow.camera.bottom = camerasize;
  }

  return this;
}

//init();
//animate();
//init();
//animate();
// TODO: Allow the execution of another function once the library is loaded. See example below.
var mm_load_library = function(name){
  try {
    eval(mm_assets_functions[name].data);
  } catch (err) {
    console.log(err);
  }
}

// var mm_load_library = function(url, callback, dom){
//     var scriptTag = document.createElement('script');
//     scriptTag.src = url;
//
//     scriptTag.onload = callback;
//     scriptTag.onreadystatechange = callback;
//
//     dom.appendChild(scriptTag);
// };
// var myCallback = function(){
//   some code...
// }
// mm_load_library('code.js', myCallback, document.body);
