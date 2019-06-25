// imports
var degrees = 180 / Math.PI;

//////////////////////////////////////////////////////////////
// ICOSAHEDRON.                                             //
//////////////////////////////////////////////////////////////
d3.icosahedron = new Object();
d3.icosahedron.angle1 = Math.atan(0.5) * degrees;
d3.icosahedron.angle2 = Math.PI * degrees / 5;
d3.icosahedron.sizeratio = 11/(3*Math.sqrt(3));
d3.icosahedron.vertices = [ [0, 90], [0, -90] ].concat(d3.range(10).map(function(i) { return [i * d3.icosahedron.angle2, i & 1 ? d3.icosahedron.angle1 : - d3.icosahedron.angle1]; }));

d3.icosahedron.faces = [
    [ 0,  3, 11], [ 0,  5,  3], [ 0,  7,  5], [ 0,  9,  7], [ 0, 11,  9], // North
    [ 2, 11,  3], [ 3,  4,  2], [ 4,  3,  5], [ 5,  6,  4], [ 6,  5,  7],
    [ 7,  8,  6], [ 8,  7,  9], [ 9, 10,  8], [10,  9, 11], [11,  2, 10], // Equator
    [ 1,  2,  4], [ 1,  4,  6], [ 1,  6,  8], [ 1,  8, 10], [ 1, 10,  2] // South
].map(function(face) { return face.map(function(i) { return d3.icosahedron.vertices[i]; }); });

d3.icosahedron.faces.forEach(function(face) {
	face.centroid = d3.geoCentroid({type: "MultiPoint", coordinates: face});
	var ring = face.map(function(d) { return [((d[0] + 180) % 360 - 180), d[1]]; });
	ring.push(ring[0]);
	face.contains = function(λ, φ) {
		return d3.geoContains({ type: "Polygon", coordinates: [ ring ] }, [λ * degrees, φ * degrees]); 
	}
});
	
d3.icosahedron.projection = function(faceProjection, folding, rotation) {
	
	folding  = folding || [ -1, 7, 9, 11, 13, 0,  5,  6,  7,  8,  9, 10, 11, 12, 13, 6, 8, 10, 12, 14 ];
	
	rotation = rotation || [ 120, 0, 0 ];
		
	var faces = d3.icosahedron.faces.map(function(face) {
		return {
			face: face,
			contains: face.contains,
			project: faceProjection(face)
		};
	});

	// Connect each face to a parent face.
	folding.forEach(function(d, i) {
		var node = faces[d];
		node && (node.children || (node.children = [])).push(faces[i]);
	});

	function findface(λ, φ) {
		for (var i = 0; i < faces.length; i++) {
			if (faces[i].contains(λ, φ)) return faces[i];
		}
	};

	// Polyhedral projection
	var proj = d3.geoPolyhedral(
		faces[0], // the root face
		findface, // a function that return a face give coords
		0         // rotation of the root face in the projected (pixel) space
	)
		.rotate(rotation)
		.fitExtent([ [margin, margin], [width - margin, height - margin] ], {type:"Sphere"});
	return proj;
}

//////////////////////////////////////////////////////////////
// DODECAHEDRON.                                            //
//////////////////////////////////////////////////////////////
var Ngold = (1 + Math.sqrt(5)) / 2;
var sqrt3 = Math.sqrt(3)

// Calculate constants that will be used to generate vertices
var a = 1/sqrt3;
var b = 1/(sqrt3*Ngold);
var c = Ngold/sqrt3;

d3.dodecahedron = new Object();
d3.dodecahedron.angle1 = Math.atan(0.5) * degrees;
d3.dodecahedron.angle2 = Math.PI * degrees / 5;
d3.dodecahedron.sizeratio = 11/10;
d3.dodecahedron.vertices = [ ];
[-1, 1].forEach(function(i) {
	[-1, 1].forEach(function(j) {
		d3.dodecahedron.vertices.push(spherical([0, i * c, j * b]));
		d3.dodecahedron.vertices.push(spherical([i * c, j * b, 0]));
		d3.dodecahedron.vertices.push(spherical([i * b, 0, j * c]));

		[-1, 1].forEach(function(k) { d3.dodecahedron.vertices.push(spherical([i * a, j * a, k * a])); });
	});
})

d3.dodecahedron.faces = [
    [19, 17, 7, 9, 15], [19, 16, 11, 14, 17], [19, 15, 10, 18, 16], [17, 14, 5, 4, 7],
	[16, 18, 12, 13, 11], [15, 9, 6, 8, 10], [18, 10, 8, 2, 12], [9, 7, 4, 1, 6],
	[14, 11, 13, 0, 5], [13, 12, 2, 3, 0], [8, 6, 1, 3, 2], [4, 5, 0, 3, 1]
].map(function(face) { return face.map(function(i) { return d3.dodecahedron.vertices[i]; }); });

d3.dodecahedron.faces.forEach(function(face) {
	face.centroid = d3.geoCentroid({type: "MultiPoint", coordinates: face});
	var ring = face.map(function(d) { return [((d[0] + 180) % 360 - 180), d[1]]; });
	ring.push(ring[0]);
	face.contains = function(λ, φ) {
		return d3.geoContains({ type: "Polygon", coordinates: [ ring ] }, [λ * degrees, φ * degrees]); 
	}
});
	
d3.dodecahedron.projection = function(faceProjection, folding, rotation) {
	
	folding  = folding || [ -1, 0, 0, 0, 1, 0,  2,  0,  3,  4,  5, 7 ];
	
	rotation = rotation || [ 0, 0, 0 ];
	
	var faces = d3.dodecahedron.faces.map(function(face) {
		return {
			face: face,
			contains: face.contains,
			project: faceProjection(face)
		};
	});

	// Connect each face to a parent face.
	folding.forEach(function(d, i) {
		var node = faces[d];
		node && (node.children || (node.children = [])).push(faces[i]);
	});

	function findface(λ, φ) {
		for (var i = 0; i < faces.length; i++) {
			if (faces[i].contains(λ, φ)) return faces[i];
		}
	};

	// Polyhedral projection
	var proj = d3.geoPolyhedral(
		faces[0], // the root face
		findface, // a function that return a face give coords
		0         // rotation of the root face in the projected (pixel) space
	)
		.rotate(rotation)
		.fitExtent([ [margin, margin], [width - margin, height - margin] ], {type:"Sphere"});
	return proj;
}



//////////////////////////////////////////////////////////////
// OCTAHEDRON.                                              //
//////////////////////////////////////////////////////////////
d3.octahedron = new Object();
d3.octahedron.angle1 = (Math.PI/2) * degrees;
d3.octahedron.angle2 = 0;
d3.octahedron.sizeratio = 2/Math.sqrt(3);
d3.octahedron.vertices = [ [0, 90], [0, -90] ].concat(d3.range(4).map(function(i) { return [180 - i * d3.octahedron.angle1, i * d3.octahedron.angle2 ]; }));

d3.octahedron.faces = [
    [0, 4, 5], [0, 3, 4], [1, 5, 4], [1, 4, 3],
	[0, 5, 2], [0, 2, 3], [1, 2, 5], [1, 3, 2]
].map(function(face) { return face.map(function(i) { return d3.octahedron.vertices[i]; }); });

d3.octahedron.faces.forEach(function(face) {
	face.centroid = d3.geoCentroid({type: "MultiPoint", coordinates: face});
	var ring = face.map(function(d) { return [((d[0] + 180) % 360 - 180), d[1]]; });
	ring.push(ring[0]);
	face.contains = function(λ, φ) {
		return d3.geoContains({ type: "Polygon", coordinates: [ ring ] }, [λ * degrees, φ * degrees]); 
	}
});
	
d3.octahedron.projection = function(faceProjection, folding, rotation) {
	
	folding  = folding || [-1, 0, 0, 1, 0, 1, 4, 5];
	
	rotation = rotation || [ 0, 0, 0 ];
	
	var faces = d3.octahedron.faces.map(function(face) {
		return {
			face: face,
			contains: face.contains,
			project: faceProjection(face)
		};
	});

	// Connect each face to a parent face.
	folding.forEach(function(d, i) {
		var node = faces[d];
		node && (node.children || (node.children = [])).push(faces[i]);
	});
	
	function findface(λ, φ) {
		for (var i = 0; i < faces.length; i++) {
			if (faces[i].contains(λ, φ)) return faces[i];
		}
	};

	// Polyhedral projection
	var proj = d3.geoPolyhedral(
		faces[0], // the root face
		findface, // a function that return a face give coords
		0         // rotation of the root face in the projected (pixel) space
	)
		.rotate(rotation)
		.fitExtent([ [margin, margin], [width - margin, height - margin] ], {type:"Sphere"});
	return proj;
}



//////////////////////////////////////////////////////////////
// HEXAHEDRON.                                              //
//////////////////////////////////////////////////////////////
d3.hexahedron = new Object();
d3.hexahedron.angle1 = 0.5 * Math.PI * degrees;
d3.hexahedron.angle2 = Math.atan(Math.SQRT1_2) * degrees;
d3.hexahedron.sizeratio = 4/3;
d3.hexahedron.vertices = [	[0, d3.hexahedron.angle2], [90, d3.hexahedron.angle2], 
							[180, d3.hexahedron.angle2], [-90, d3.hexahedron.angle2], 
							[0, -d3.hexahedron.angle2], [90, -d3.hexahedron.angle2], 
							[180, -d3.hexahedron.angle2], [-90, -d3.hexahedron.angle2] ];

d3.hexahedron.faces = [ [0, 3, 2, 1], // N
						[0, 1, 5, 4],
						[1, 2, 6, 5],
						[2, 3, 7, 6],
						[3, 0, 4, 7],
						[4, 5, 6, 7] // S
].map(function(face) { return face.map(function(i) { return d3.hexahedron.vertices[i]; }); });

d3.hexahedron.faces.forEach(function(face) {
	face.centroid = d3.geoCentroid({type: "MultiPoint", coordinates: face});
	var ring = face.map(function(d) { return [((d[0] + 180) % 360 - 180), d[1]]; });
	ring.push(ring[0]);
	face.contains = function(λ, φ) {
		return d3.geoContains({ type: "Polygon", coordinates: [ ring ] }, [λ * degrees, φ * degrees]); 
	}
});
	
d3.hexahedron.projection = function(faceProjection, folding, rotation) {
	
	folding  = folding || [-1, 0, 0, 0, 0, 4];
	
	rotation = rotation || [ 0, 0, 0 ];
	
	var faces = d3.hexahedron.faces.map(function(face) {
		return {
			face: face,
			contains: face.contains,
			project: faceProjection(face)
		};
	});

	// Connect each face to a parent face.
	folding.forEach(function(d, i) {
		var node = faces[d];
		node && (node.children || (node.children = [])).push(faces[i]);
	});
	
	function findface(λ, φ) {
		for (var i = 0; i < faces.length; i++) {
			if (faces[i].contains(λ, φ)) return faces[i];
		}
	};

	// Polyhedral projection
	var proj = d3.geoPolyhedral(
		faces[0], // the root face
		findface, // a function that return a face give coords
		-1 * Math.PI / 4         // rotation of the root face in the projected (pixel) space
	)
		.rotate(rotation)
		.fitExtent([ [margin, margin], [width - margin, height - margin] ], {type:"Sphere"});
	return proj;
}



//////////////////////////////////////////////////////////////
// TETRAHEDRON.                                             //
//////////////////////////////////////////////////////////////

d3.tetrahedron = new Object();
d3.tetrahedron.angle1 = 0.5 * Math.PI * degrees;
d3.tetrahedron.angle2 = Math.atan( Math.sqrt( 2 ) / 4 ) * degrees;
d3.tetrahedron.sizeratio = Math.sqrt( 3 )/2;
d3.tetrahedron.vertices = [[0, 90], [0, -d3.tetrahedron.angle2], [120, -d3.tetrahedron.angle2], [240, -d3.tetrahedron.angle2]];

d3.tetrahedron.faces = [	[1, 2, 3], 
							[0, 1, 3], 
							[1, 0, 2], 
							[3, 2, 0]
].map(function(face) { return face.map(function(i) { return d3.tetrahedron.vertices[i]; }); });

d3.tetrahedron.faces.forEach(function(face) {
	face.centroid = d3.geoCentroid({type: "MultiPoint", coordinates: face});
	var ring = face.map(function(d) { return [((d[0] + 180) % 360 - 180), d[1]]; });
	ring.push(ring[0]);
	face.contains = function(λ, φ) {
		return d3.geoContains({ type: "Polygon", coordinates: [ ring ] }, [λ * degrees, φ * degrees]); 
	}
});
	
d3.tetrahedron.projection = function(faceProjection, folding, rotation) {
	
	folding  = folding || [-1, 0, 1, 2];
	
	rotation = rotation || [ 0, 0, 0 ];
	
	var faces = d3.tetrahedron.faces.map(function(face) {
		return {
			face: face,
			contains: face.contains,
			project: faceProjection(face)
		};
	});

	// Connect each face to a parent face.
	folding.forEach(function(d, i) {
		var node = faces[d];
		node && (node.children || (node.children = [])).push(faces[i]);
	});
	
	function findface(λ, φ) {
		for (var i = 0; i < faces.length; i++) {
			if (faces[i].contains(λ, φ)) return faces[i];
		}
	};

	// Polyhedral projection
	var proj = d3.geoPolyhedral(
		faces[0], // the root face
		findface, // a function that return a face give coords
		-Math.PI/2         // rotation of the root face in the projected (pixel) space
	)
		.rotate(rotation)
		.fitExtent([ [margin, margin], [width - margin, height - margin] ], {type:"Sphere"});
	return proj;
}


// Converts 3D Cartesian to spherical coordinates (degrees).
function spherical(cartesian) {
  return [
    Math.atan2(cartesian[1], cartesian[0]) * degrees,
    Math.asin(Math.max(-1, Math.min(1, cartesian[2]))) * degrees
  ];
}
