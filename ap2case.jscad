// 3d printed case for anne pro 2
// By Justin Pu

/**
 * The following constants define the dimensions of the resulting model. 
 * Warning: some values may cause the shape to no longer be valid.
 */
const hole = -0.35; // Horizontal adjustment for holes. You can figure this out by printing hole tests
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

// The socket for screw
let screwHolePillar = (x, y) => {
    let outerR = 5/2, innerR = (1.8-hole)/2;
    let height = bedAtY(y + outerR);
    return cylinder({r:outerR,h:height}).translate([x,y,-height]);
};

// The hole of the screw hole
let screwHoleHole = (x, y) => {
    let outerR = 5/2, innerR = (1.8-hole)/2;
    let height = bedAtY(y + outerR);
    return cylinder({r:innerR, h: height}).translate([x,y,-height]);
};

let screwHole = (x,y) => {
    return difference(screwHolePillar(x, y), screwHoleHole(x, y));
};

// Locations of screw hole relative on pcb
let screwLocations = [
    [24, 65],
    [47, 20],
    [148, 56],
    [210, 15],
    [259, 65],
].map(x => [284 - x[0], 1 + x[1]]);

let screwHoles = () => {
    return union(...screwLocations.map(x => screwHole(...x)));
};

let screwHoleHoles = () => {
    return union(...screwLocations.map(x => screwHoleHole(...x)));
};

// Lines across the bottom to hold up the pcb
let support = () => {
    const supportWidth = 1;
    const supportLengthh = 4 + leeway;
    const supportLengthv = 2 + leeway;

    let single = y => {
        let depth = bedAtY(y);
        return cube({size:[innerx, supportWidth, depth]}).translate([-leeway, y, -depth]);
    };

    let horizontal = (y, left) => {
        if(left == undefined) // Do both sides 
            return union(horizontal(y, true), horizontal(y, false));
        
        let depth = bedAtY(y);

        return cube({size:[supportLengthh, supportWidth, depth]})
            .translate(
                left?
                    [-leeway, y, -depth]:
                    [innerx - leeway - supportLengthh, y, -depth]);
    }

    let vertical = (x, top) => {
        if(top == undefined)
            return union(vertical(x, true), vertical(x, false));
        
        if(top) {
            let y1 = bedAtY(innery), y2 = bedAtY(innery - supportLengthv);
            return rotate([90, 0, -90], linear_extrude({height:supportWidth}, polygon([[0, 0], [0, -y1], [supportLengthv, -y2], [supportLengthv, 0]]))).translate([x + supportWidth/2, innery - leeway, 0]);
        }
        // else
        let y1 = bedAtY(supportLengthv), y2 = bedAtY(0);
        return rotate([90, 0, -90], linear_extrude({height:supportWidth}, polygon([[0, 0], [0, -y1], [supportLengthv, -y2], [supportLengthv, 0]]))).translate([x + supportWidth/2, supportLengthv - leeway, 0]);
    }

    // All supports
    return difference(
        union(
            horizontal(18),
            horizontal(37),
            horizontal(56),
            horizontal(75),
            // Vertical top
            vertical(34, true),
            vertical(60, true),
            vertical(98, true),
            vertical(136, true),
            vertical(174, true),
            vertical(212, true),
            vertical(250, true),
            // Vertical bottom
            vertical(20, false),
            vertical(70, false),
            vertical(110, false),
            vertical(148, false),
            vertical(185, false),
            vertical(215, false),
            vertical(260, false),
        ),
        screwHoleHoles()
    );
};

// Usb insert
// Hole consists of two half circles with one rectangle
// Outer recess to help usb reach socket
let usbHole = () => {
    const innerWidth = 1.8;
    const yOffset = -0.2;

    const height = 3;
    const length = 9;
    const rectl = length - height;

    const recessRadius = 7;

    return union(
        linear_extrude({height:widthy}, hull(circle(height/2), square([rectl, height]).translate([height/2, 0]), circle(height/2).translate([rectl,0]))).rotateX(-90).translate([14, innery - leeway, yOffset]), // hole
        linear_extrude({height:widthy - innerWidth}, circle(recessRadius)).rotateX(-90).translate([14+1.5 * height -recessRadius, innery + innerWidth - leeway, yOffset - 1.5 + recessRadius])
    );
};

// Main frame
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

    return union(
        difference(
            side, 
            usbHole()
        ), 
        bottom, 
        screwHoles(),
        support(),
    );
}

function main() {
    return frame();
}
