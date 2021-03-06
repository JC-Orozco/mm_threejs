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

THREE.Mesh.prototype.setMaterial = function(transparent, opacity, material){
  material.transparent = transparent;
  material.opacity = opacity;
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
  
  m.castShadow = mm_three_toolbar.shadows;
  m.receiveShadow = mm_three_toolbar.shadows;
  
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

  m.castShadow = mm_three_toolbar.shadows;
  m.receiveShadow = mm_three_toolbar.shadows;
  
  m.matrixAutoUpdate = true; // Without this setting the transforms do not work.
  return m;
}

var mm_set = function(object3d){
  object3d.matrixAutoUpdate = true; // Without this setting the transforms do not work.
  //object3d.matrixWorld = false; // Without this setting the transforms do not work. // still doest work with pointlight and setlightshadow
  object3d.castShadow = mm_three_toolbar.shadows;
  if(object3d.shadow && mm_three_toolbar.shadows){
    object3d.shadow.mapSize.width = 1024;
    object3d.shadow.mapSize.height = 1024;
  }
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

// TODO: Now returns shapes instead of Vector2 array
// TODO: Accept list of arrays and return list of shapes (array of shapes)
var mm_polygon = function(arr){
  var list = [];
  var shapes;
  
  try{
    if(arr.length > 0){
      // Check if there is only one polygon
      if(typeof arr[0][0] == "number"){
        for(let i=0; i<arr.length; i++){
          list.push(new THREE.Vector2(arr[i][0], arr[i][1]));
        }
        //console.log(list);

        shapes = new THREE.Shape(list);
      } else {
        shapes = [];
        for(let pol of arr){
          list = [];
          for(let i=0; i<pol.length; i++){
            list.push(new THREE.Vector2(pol[i][0], pol[i][1]));
          }
          //console.log(list);

          shapes.push(new THREE.Shape(list));          
        }
      }
    }
  }
  catch(err){
    console.log(err);
    shapes = [];
  }
  return shapes;
}

var mm_twist_scale_fn = function(geometry, twist_fn, scale_fn){
  //  var _angle = function(z, twist_fn){
  //    return twist_fn(z)// k*z*Math.PI*2
  //  }

  var _rotate = function(v, twist_fn, scale_fn){
    var angle = twist_fn(v.z)*Math.PI*2; // Convert 0 to 1 -> 0 to 360  _angle(v.z, k)
    //console.log(angle)
    var x = v.x*Math.cos(angle) - v.y*Math.sin(angle)
    var y = v.x*Math.sin(angle) + v.y*Math.cos(angle)
    return new THREE.Vector3(x*scale_fn(v.z),y*scale_fn(v.z),v.z)
  }
  
  //var g2 = g.clone();
  var i = 0
  for(let v of geometry.vertices){
      //g2.vertices[i] = _rotate(v, k)
      geometry.vertices[i] = _rotate(v, twist_fn, scale_fn)
      i += 1
  }
  //return g2
}

var mm_twist_fn = function(geometry, twist_fn){
  mm_twist_scale_fn(geometry, twist_fn, function(z){return 1.0;})
}

// JCOA: TODO Use array of points instead of functions. Shape with interpolated points.
// var mm_twist_scale = function(geometry, twist, scale){}
// var mm_twist = function(geometry, twist){}

var mm_extrude = function(shapes, height, segments, twist){
  segments = segments || 1
  twist = twist || 0
  
  //  var _angle = function(z, k){
  //    return k*z*Math.PI*2
  //  }
  //
  //  var _rotate = function(v, k){
  //    var angle = _angle(v.z, k)
  //    //console.log(angle)
  //    var x = v.x*Math.cos(angle) - v.y*Math.sin(angle)
  //    var y = v.x*Math.sin(angle) + v.y*Math.cos(angle)
  //    return new THREE.Vector3(x,y,v.z)
  //  }
  //
  //  var _twist = function(g, k){
  //    //var g2 = g.clone();
  //    var i = 0
  //    for(let v of g.vertices){
  //        //g2.vertices[i] = _rotate(v, k)
  //        g.vertices[i] = _rotate(v, k)
  //        i += 1
  //    }
  //    //return g2
  //  }
  
  //var shape = new THREE.Shape(polygon);
  var extrudeSettings1 = {
      bevelEnabled: false,
      steps: segments,
      amount: height
  };

  var geometry1 = new THREE.ExtrudeGeometry( shapes, extrudeSettings1 );
  if(twist!=0){
    mm_twist_fn(geometry1, function(z){return z*twist/(height*360.0)});
  }
  return mm_new_mesh(geometry1);
}

var mm_cylinder = function(diameter1, diameter2, height, sides, heightSegments){
  var objectGeometry = new THREE.CylinderGeometry(diameter1/2, diameter2/2, height, sides, heightSegments);
  objectGeometry.rotateX(Math.PI/2);
  return mm_new_mesh(objectGeometry);
}

var mm_lathe = function(shapes, divisions, closed){
  var polygon;
  if(shapes instanceof Array){
    polygon = shapes[0].extractPoints().shape;
  } else {
    polygon = shapes.extractPoints().shape;
  }
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

var mm_spiral = function(height, segments, angle_p, radius_p){
  var points = [];
  var dz, dp, p;
  if(segments>0){
    dz = height/segments;
    dp = 1.0/segments;
  }
  var angle, radius;
  var x, y, z;
  for(var i=0; i<segments; i++){
    z = dz*i;
    p = dp * i;
    angle = angle_p(p)*Math.PI/180.0;
    radius = radius_p(p);
    x = radius*Math.sin(angle);
    y = radius*Math.cos(angle);
    points.push(new THREE.Vector3(x, y, z));
  }
  //console.log(points);
  return points;
}

var mm_extrude_path = function(shapes, path, divisions, closed){
  var points = []; // path.extractPoints(divisions).shape;
  if(path instanceof Array){
    points = path[0].extractPoints(divisions).shape;
  } else {
    points = path.extractPoints(divisions).shape;
  }
  // var divisions = 50;
  //var shape = new THREE.Shape(polygon);

  var vlist = [];
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

  var path3 = new THREE.CatmullRomCurve3( vlist );
  //var path3 = new THREE.SplineCurve3( vlist ); // Obsolete
  
  var extrudeSettings = {
      bevelEnabled: false,
      steps: divisions, // Number of subdivisions of the extrude
      extrudePath: path3
  };
  var geometry = new THREE.ExtrudeGeometry( shapes, extrudeSettings );
  return mm_new_mesh(geometry);
}

//var material = new THREE.MeshStandardMaterial( { color : 0x00cc00 } );
//
////create a triangular geometry
//var geometry = new THREE.Geometry();
//geometry.vertices.push( new THREE.Vector3( -50, -50, 0 ) );
//geometry.vertices.push( new THREE.Vector3(  50, -50, 0 ) );
//geometry.vertices.push( new THREE.Vector3(  50,  50, 0 ) );
//
////create a new face using vertices 0, 1, 2
//var normal = new THREE.Vector3( 0, 1, 0 ); //optional
//var color = new THREE.Color( 0xffaa00 ); //optional
//var materialIndex = 0; //optional
//var face = new THREE.Face3( 0, 1, 2, normal, color, materialIndex );
//
////add the face to the geometry's faces array
//geometry.faces.push( face );
//
////the face normals and vertex normals can be calculated automatically if not supplied above
//geometry.computeFaceNormals();
//geometry.computeVertexNormals();
//
//scene.add( new THREE.Mesh( geometry, material ) );

// JCOA Implementation on extrude path using a normal extrude as starter, use each extrude unit as an index and then addapt each polygon to their corresponding path point. Use the previous and nest path points to calculate an average angle that will be used to place the polygon. Do not rotate the poligon on the other axis (define other axis)
var mm_extrude_spiral = function(height, segments, shapes, rotations_p, radius_p){
  var polygon;
  if(shapes instanceof Array){
    polygon = shapes[0].extractPoints().shape;
  } else {
    polygon = shapes.extractPoints().shape;
  }  
  var polygonLen = polygon.length;

  var dz, dp, p;
  if(segments>0){
    dz = height/(segments);
    dp = 1.0/(segments);
  } else {
    dz = 0;
    dp = 0;
  }
  var angle, radius;
  var x, y, z;
  
  var pol3 = [];  
  for(let v of polygon){
    pol3.push(new THREE.Vector3(v.x, 0, v.y))
  }
  
  var theta_phy = function(p1, p2){
    let p = new THREE.Vector3();
    p.subVectors(p2, p1);
    // How to handle a 0,0 vector? Maybe get last known angle?
    let xy = new THREE.Vector2(p.x,p.y)
    let zr = new THREE.Vector2(p.z,xy.length())
    return [zr.angle(), xy.angle()]
  }
  
  //  var segments = pathLen-1;
  //  var height = pathLen-1;
  //  
  //  var shape = new THREE.Shape(polygon);
  //  var extrudeSettings1 = {
  //      bevelEnabled: false,
  //      steps: segments,
  //      amount: height
  //  };
  //  var geometry1 = new THREE.ExtrudeGeometry( shape, extrudeSettings1 );
  
  var geometry1 = new THREE.Geometry();
    
  var i = 0
  var j = 0
  var n = 0
  var yn = new THREE.Vector3(0,1,0)
  var zn = new THREE.Vector3(0,0,1)

  v1 = new THREE.Vector3(0,0,0)
  for(j=0; j<segments+1; j++){
    z = dz*j;
    p = dp*j;
    angle = 360*rotations_p(p)*Math.PI/180.0; // Rotations
    radius = radius_p(p);
    //x = radius*Math.sin(angle);
    //y = radius*Math.cos(angle);
    
    v1.set(radius,0,z);
    // JCOA: Possible optimization, set rotation matrix (apply Euler to matrix) then transform each vector using matrix.
    //let e1 = new THREE.Euler(0, theta_phy_arr[j][0], theta_phy_arr[j][1], "XYZ")
    i = 0;
    for(let v of pol3){
      let vn = v.clone() // new THREE.Vector3()
      // vn.addVectors(v,p)
      //vn.applyEuler(e1)
      
      //vn.applyAxisAngle(yn, theta_phy_arr[j][0])
      vn.add(v1)
      vn.applyAxisAngle(zn, angle)
      geometry1.vertices.push(vn); // geometry1.vertices[i] = vn
      if(j<segments){
        if(i<polygonLen){
          if(i==polygonLen-1){
            geometry1.faces.push(new THREE.Face3(n, n+polygonLen, n+1-polygonLen))
            geometry1.faces.push(new THREE.Face3(n+polygonLen, n+1, n+1-polygonLen))
          } else {
            geometry1.faces.push(new THREE.Face3(n, n+polygonLen, n+1))
            geometry1.faces.push(new THREE.Face3(n+polygonLen, n+1+polygonLen, n+1))
          }
        }
      }
      i += 1
      n += 1
    }
  }
  
  // Add initial and final faces:
  var finalPol = polygonLen*(segments);
  for(i=0; i<polygonLen-2; i+=1){
    geometry1.faces.push(new THREE.Face3(0,i+1,i+2));
    geometry1.faces.push(new THREE.Face3(finalPol,finalPol+i+2,finalPol+i+1))    
  }
  
  // Add angle helper functions.
  // First rotate polygon in y and then in z.
  // In not closed, first and last points use only the first and last lines. The rest of the points use the previous and next angles averaged. Use x to y angle and x to z angle helper functions.
  
  // This next command is not solving the face orientation problems, we may be missing faces too
  // We may need to generate our own faces for this to work
  geometry1.computeFaceNormals()
  geometry1.computeVertexNormals();

  return mm_new_mesh(geometry1)  
}

var mm_merge_geometry  = function(object){
  var geometry = new THREE.Geometry();
  var objectGeometry = object.geometry;
  if(object.geometry instanceof THREE.BufferGeometry){
    objectGeometry = new THREE.Geometry().fromBufferGeometry( object.geometry );
    
//    objectGeometry.computeFaceNormals()
//    objectGeometry.computeVertexNormals();

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
          
//          g.computeFaceNormals()
//          g.computeVertexNormals();
          
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
      //console.log("Finish loading");
      //mm_group.add(object);
//      var geometry1 = mm_merge_geometry(object);
//      geometry1.computeFaceNormals()
//      geometry1.computeVertexNormals();
//      
//      mm_group.add(mm_new_mesh(geometry1));

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
      console.error(err);
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
      //console.log("Finish loading");
      //mm_group.add(object);

      var geometry1 = mm_merge_geometry(object);
      geometry1.computeFaceNormals()
      geometry1.computeVertexNormals();
      
      mm_group.add(mm_new_mesh(geometry1));
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
      console.error(err);
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

  if ( Detector.webgl ){
    mm_renderer = new THREE.WebGLRenderer( {antialias:true} );
    mm_renderer.shadowMap.enabled = true; // mm_three_toolbar.shadows;
    mm_renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
  } else {
    mm_renderer = new THREE.CanvasRenderer();
  }
	//mm_renderer = new THREE.WebGLRenderer( {antialias:true} );
  var three_div = document.getElementById("three");
  var three_container = document.getElementById("three-container");
  //mm_renderer.setSize( window.innerWidth, 0.43*window.innerHeight );
  mm_renderer.setSize( three_container.clientWidth, three_container.clientHeight );
  //mm_renderer.setSize( 300, 300 );
  mm_renderer.setClearColor(0x141414);

  three_div.appendChild( mm_renderer.domElement );

//  if (mm_three_toolbar.orthografic){
//    mm_camera = new THREE.PerspectiveCamera( 60, three_container.clientWidth / (three_container.clientHeight), 1, 1000 ); //60 was 75
//  //mm_camera = new THREE.PerspectiveCamera( 60, window.innerWidth / (window.innerHeight), 1, 1000 ); //60 was 75
//  //mm_camera = new THREE.CombinedCamera( window.innerWidth / 2, window.innerHeight / 2, 70, 1, 1000, - 500, 1000 );
//  } else {
    mm_camera = new THREE.OrthographicCamera( three_container.clientWidth / - 2, three_container.clientWidth / 2, three_container.clientHeight / 2, three_container.clientHeight / - 2, 1, 1000 );
//  }
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
  //mm_material = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, wireframe:  mm_three_toolbar.wireframe, wireframeLinewidth: 1 } );

  mm_material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF, wireframe:  mm_three_toolbar.wireframe, wireframeLinewidth: 1 } );
  
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
  try{
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
  } catch(err) {
    console.error(err);
  }
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
  //console.log(that.id);
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
    console.error(err);
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

// VR functions:
var mm_container,
    mm_effect

    function initVR() {
      var mm_element
      
      mm_scene = new THREE.Scene();
      mm_camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.001, 2000);
      mm_camera.position.set(0, 15, 0);
      //mm_camera.up = new THREE.Vector3( 0, 0, 1 ); // Turn camera so z axis points up
      mm_camera.lookAt(new THREE.Vector3( 0, 0, 0 ));
      
      //mm_scene.add(mm_camera);
      mm_renderer = new THREE.WebGLRenderer();
      mm_element = mm_renderer.domElement;
      mm_container = document.getElementById('three');
      mm_container.appendChild(mm_element);
      mm_effect = new THREE.StereoEffect(mm_renderer);
      // Our initial control fallback with mouse/touch events in case DeviceOrientation is not enabled
      mm_controls = new THREE.OrbitControls(mm_camera, mm_element);
      mm_controls.target.set(
        mm_camera.position.x + 0.15,
        mm_camera.position.y,
        mm_camera.position.z
      );
      mm_controls.enablePan = false;
      mm_controls.enableZoom = false;
      // Our preferred controls via DeviceOrientation
      function setOrientationControls(e) {
        if (!e.alpha) {
          return;
        }
        mm_controls = new THREE.DeviceOrientationControls(mm_camera, true);
        //mm_controls.updateAlphaOffsetAngle(1.5708/4) // 90 Z
        mm_controls.connect();
        mm_controls.update();
        mm_element.addEventListener('click', fullscreen, false);
        window.removeEventListener('deviceorientation', setOrientationControls, true);
      }
      window.addEventListener('deviceorientation', setOrientationControls, true);
      // Lighting
      var light = new THREE.PointLight(0x999999, 2, 100);
      light.position.set(50, 50, 50);
      mm_scene.add(light);

      var lightScene = new THREE.PointLight(0x999999, 2, 100);
      lightScene.position.set(0, 5, 0);
      mm_scene.add(lightScene);
      mm_clock = new THREE.Clock();

      mm_material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF, wireframe:  mm_three_toolbar.wireframe, wireframeLinewidth: 1 } );

      animateVR();
    }

    function animateVR() {
      var elapsedSeconds = mm_clock.getElapsedTime()
      requestAnimationFrame(animateVR);
      updateVR(mm_clock.getDelta());
      renderVR(mm_clock.getDelta());
    }
    function resizeVR() {
      var width = mm_container.offsetWidth;
      var height = mm_container.offsetHeight;
      mm_camera.aspect = width / height;
      mm_camera.updateProjectionMatrix();
      mm_renderer.setSize(width, height);
      mm_effect.setSize(width, height);
    }
    function updateVR(dt) {
      resizeVR();
      mm_camera.updateProjectionMatrix();
      mm_controls.update(dt);
    }
    function renderVR(dt) {
      mm_effect.render(mm_scene, mm_camera);
    }
    function fullscreen() {
      if (mm_container.requestFullscreen) {
        mm_container.requestFullscreen();
      } else if (mm_container.msRequestFullscreen) {
        mm_container.msRequestFullscreen();
      } else if (mm_container.mozRequestFullScreen) {
        mm_container.mozRequestFullScreen();
      } else if (mm_container.webkitRequestFullscreen) {
        mm_container.webkitRequestFullscreen();
      }
    }
