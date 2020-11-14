// 3d printed case for anne pro 2
// By Justin Pu

/**
 * The following constants define the dimensions of the resulting model. 
 * Warning: some values may cause the shape to no longer be valid.
 */
const hole = -0.35; // Horizontal adjustment for holes. You can figure this out with hole tests
const angle = 5; // Incline of the case in degrees

const widthx=3.5, widthy = 5; // Width of the sides
const out = 14; // How much the case pops out from the lower pcb level. Lower this for low profile case
const depth = 5; // How much lower the case goes from the pcb
const leeway = 0; // Amount of extra space from sides to pcb/plate
const bottomThickness = 3; // Thickness of the bottom

// Calculations. Don't change this
const innerx = 285+2*leeway, innery = 95+2*leeway, outerx = innerx+2*widthx, outery = innery+2*widthy;
const height = out + depth + outery * tan(angle);


// Helper function for calculating the level of the top of the bottom at a certain y coordinate
let bedAtY = y => (y + widthy + leeway + 1) * tan(angle) + depth - bottomThickness;

let screwHolePillar = (x, y) => {
    let outerR = 5/2, innerR = (1.8-hole)/2;
    let height = bedAtY(y + outerR);
    return cylinder({r:outerR,h:height}).translate([x,y,-height]);
};

let screwHoleHole = (x, y) => {
    let outerR = 5/2, innerR = (1.8-hole)/2;
    let height = bedAtY(y + outerR);
    return cylinder({r:innerR, h: height}).translate([x,y,-height]);
};

let screwHole = (x,y) => {
    return difference(screwHolePillar(x, y), screwHoleHole(x, y));
};

let screwLocations = [
    [284-24, 1+65],
    [284-47, 1+20],
    [284-148, 1+56],
    [284-210, 1+15],
    [284-259, 1+65],
]

let screws = () => {
    return union(...screwLocations.map(x => screwHole(x[0], x[1])));
};

let screwHoles = () => {
    return union(...screwLocations.map(x => screwHoleHole(x[0], x[1])));
};

let support = () => {
    const supportWidth = 1;

    let single = y => {
        let depth = bedAtY(y);
        return cube({size:[innerx, supportWidth, depth]}).translate([-leeway, y, -depth]);
    };

    return difference(
        union(
            single(18),
            single(37),
            single(56),
            single(75)),
        screwHoles());
};

// Usb insert
let usbHole = () => {
    // TODO: Add horizontal hole offset
    // TODO: Add outer recess
    return linear_extrude({height:widthy}, hull(circle(1.5), square([6, 3]).translate([1.5, 0]), circle(1.5).translate([6,0]))).rotateX(-90).translate([14, innery, -1.5]);
};

let frame = () => {
    // Bottom
    let bottom = square([outerx, bottomThickness / cos(angle)])
        .extrude({offset:[0, (outery) * tan(angle), outery]})
        .rotateX(-90)
        .translate([-widthx-leeway, -widthy-leeway, -depth + bottomThickness / cos(angle)]);

    let side = difference(
        cube({size:[outerx, outery, height]}) // Main block
            .translate([-widthx, -widthy, 0]),
        cube({size:[innerx, innery, height]}), // Hollow
        cube({size:[outerx, outery/cos(angle)+1, -outery*sin(angle)-1]}).rotateX(-angle).translate([-widthx, -widthy, outery * tan(angle)]) // Angle
    ).translate([-leeway,-leeway,-(depth + outery * tan(angle))]);

    return union(difference(side, usbHole()), bottom, screws(), support());
}

function main() {
    return frame();
}
