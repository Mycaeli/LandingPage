let pendulums = [];
const numPendulums = 25;
const d = 0.0001;
let resetTime = 40000; // Reset time in milliseconds (40 seconds)
let lastReset = 0;     // Stores the last reset time

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas-container");
  initializePendulums();
  lastReset = millis(); // Set initial time for the timer
}

function draw() {
  background(0);

  // Check if 40 seconds have passed
  if (millis() - lastReset >= resetTime) {
    initializePendulums(); // Reinitialize pendulums
    lastReset = millis(); // Reset the timer
  }

  for (let pendulum of pendulums) {
    pendulum.update();
    pendulum.display();
  }
}

// Initializes pendulums with initial settings
function initializePendulums() {
  pendulums = []; // Clear existing pendulums
  const m1 = 10;
  const m2 = 10;
  const a1 = PI / 4;
  const a2 = PI / 2;
  const g = 1;

  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < numPendulums; i++) {
    const r1 = 150 + i * d;
    const r2 = 50 - i * d;
    pendulums.push(new DoublePendulum(r1, r2, m1, m2, a1, a2, g, cx, cy, false, 1, false));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Method to change particle type to 0 (Regular Particle) when key '1' is pressed
function key1Pressed() {
  for (let pendulum of pendulums) {
    pendulum.emitter.particleType = 0;
  }
}

// Method to change particle type to 1 (TriangleParticle) when key '2' is pressed
function key2Pressed() {
  for (let pendulum of pendulums) {
    pendulum.emitter.particleType = 1;
  }
}

// Method to change particle type to 2 (SquareParticle) when key '3' is pressed
function key3Pressed() {
  for (let pendulum of pendulums) {
    pendulum.emitter.particleType = 2;
  }
}

// Key pressed function to bind '1', '2', '3' keys to the particle type change
function keyPressed() {
  if (key === '1') {
    key1Pressed();
  } else if (key === '2') {
    key2Pressed();
  } else if (key === '3') {
    key3Pressed();
  }
}

class DoublePendulum {
  constructor(r1, r2, m1, m2, a1, a2, g, cx, cy, trailEnabled = true, trailLength = 200, visible = true) {
    this.r1 = r1;
    this.r2 = r2;
    this.m1 = m1;
    this.m2 = m2;
    this.a1 = a1;
    this.a2 = a2;
    this.a1_v = 0;
    this.a2_v = 0;
    this.g = g;
    this.cx = cx; // Center x
    this.cy = cy; // Center y

    this.trailEnabled = trailEnabled;
    this.trail = [];
    this.trailLength = trailLength;
    this.visible = visible;

    // Create an emitter at the position of the second bob
    this.emitter = new Emitter(0, 0);

    // Initialize angleDiff and currentHue
    this.angleDiff = 0;
    this.currentHue = 0;
  }

  update() {
    // Calculate accelerations and update velocities and angles (unchanged)
    let num1 = -this.g * (2 * this.m1 + this.m2) * sin(this.a1);
    let num2 = -this.m2 * this.g * sin(this.a1 - 2 * this.a2);
    let num3 = -2 * sin(this.a1 - this.a2) * this.m2;
    let num4 = this.a2_v * this.a2_v * this.r2 + this.a1_v * this.a1_v * this.r1 * cos(this.a1 - this.a2);
    let den = this.r1 * (2 * this.m1 + this.m2 - this.m2 * cos(2 * this.a1 - 2 * this.a2));
    let a1_a = (num1 + num2 + num3 * num4) / den;

    num1 = 2 * sin(this.a1 - this.a2);
    num2 = (this.a1_v * this.a1_v * this.r1 * (this.m1 + this.m2));
    num3 = this.g * (this.m1 + this.m2) * cos(this.a1);
    num4 = this.a2_v * this.a2_v * this.r2 * this.m2 * cos(this.a1 - this.a2);
    den = this.r2 * (2 * this.m1 + this.m2 - this.m2 * cos(2 * this.a1 - 2 * this.a2));
    let a2_a = (num1 * (num2 + num3 + num4)) / den;

    this.a1_v += a1_a;
    this.a2_v += a2_a;
    this.a1 += this.a1_v;
    this.a2 += this.a2_v;

    // Normalize angles to keep them within 0 to TWO_PI
    this.a1 = (this.a1 + TWO_PI) % TWO_PI;
    this.a2 = (this.a2 + TWO_PI) % TWO_PI;

    // Update angleDiff and currentHue
    this.angleDiff = (this.a1 - this.a2 + TWO_PI) % TWO_PI;
    this.currentHue = map(this.angleDiff, 0, TWO_PI, 0, 255);

    // Store trail positions and hues if trail is enabled
    if (this.trailEnabled) {
      let x1 = this.r1 * sin(this.a1);
      let y1 = this.r1 * cos(this.a1);
      let x2 = x1 + this.r2 * sin(this.a2);
      let y2 = y1 + this.r2 * cos(this.a2);

      // Save position and hue at this point in time
      this.trail.push({ x: x2, y: y2, hue: this.currentHue });

      // Limit the trail length
      if (this.trail.length > this.trailLength) {
        this.trail.shift();
      }
    }

    // Update emitter position to follow the second bob (m2)
    let x1 = this.r1 * sin(this.a1);
    let y1 = this.r1 * cos(this.a1);
    let x2 = x1 + this.r2 * sin(this.a2);
    let y2 = y1 + this.r2 * cos(this.a2);

    // Update the emitter's origin (commented out for now)
    this.emitter.origin.set(x2 + this.cx, y2 + this.cy);
    this.emitter.addParticle(this.currentHue);
  }

  display() {
    colorMode(HSB);
    // Save current transformation state
    push();    
    // Translate to the center of the canvas
    translate(this.cx, this.cy);
    strokeWeight(2);

    let x1 = this.r1 * sin(this.a1);
    let y1 = this.r1 * cos(this.a1);
    let x2 = x1 + this.r2 * sin(this.a2);
    let y2 = y1 + this.r2 * cos(this.a2);

    if (this.visible){
      // Use this.currentHue for the colors
      stroke(this.currentHue, 255, 255);
      fill(this.currentHue, 255, 255);

      // Draw first arm and bob
      line(0, 0, x1, y1);
      ellipse(x1, y1, this.m1, this.m1);
      // Draw second arm and bob
      line(x1, y1, x2, y2);
      ellipse(x2, y2, this.m2, this.m2);
    }

    // Draw the trail if enabled
    if (this.trailEnabled && this.trail.length > 1) {
      noFill();
      beginShape();
      let prevPoint = this.trail[0]; // Start with the first point

      for (let i = 1; i < this.trail.length; i++) {
        let currentPoint = this.trail[i];
        stroke(currentPoint.hue, 255, 255);
        line(prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y);
        prevPoint = currentPoint;
      }
      endShape();
    }

    // Restore previous transformation state
    pop();

    // Display particles from the emitter
    this.emitter.run();
  }
}

class Emitter {
  constructor(x, y) {
    this.origin = createVector(x, y);
    this.particles = [];
    this.particleType = 0; // This variable determines the particle type (0, 1, or 2)
  }

  // Method to add a particle based on the particleType value
  addParticle(color) {
    switch (this.particleType) {
      case 0:
        this.particles.push(new Particle(this.origin.x, this.origin.y, color));
        break;
      case 1:
        this.particles.push(new TriangleParticle(this.origin.x, this.origin.y, color));
        break;
      case 2:
        this.particles.push(new SquareParticle(this.origin.x, this.origin.y, color));
        break;
      default:
        this.particles.push(new Particle(this.origin.x, this.origin.y, color)); // Fallback to Particle
        break;
    }
  }

  // Method to update and display all particles
  run() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.run();
      if (p.isDead()) {
        this.particles.splice(i, 1); // Remove dead particles
      }
    }
  }
}

class Particle {
  constructor(x, y, color) {
    this.position = createVector(x, y);

    // Random initial velocity with dynamic speed scaling
    let speed = random(0.5, 2); // Speed range between 0.5 and 2
    this.velocity = createVector(random(-1, 1), random(-1, 0)).mult(speed);

    this.acceleration = createVector(0, 0);

    // Dynamic lifespan
    this.lifespan = random(150, 300); // Lifespan range between 150 and 300
    this.lifespanDecayRate = random(1, 3); // How fast lifespan decreases

    // Max size of the particle
    this.maxSize = 8; // Maximum particle size

    // Store the passed color
    this.color = color;
  }

  run() {
    let gravity = createVector(0, 0.05);
    let wind = createVector(-0.02, 0); // Small wind force from the right

    this.applyForce(gravity);
    this.applyForce(wind); // Apply wind force

    this.update();
    this.show();
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  // Method to update position
  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    
    // Decrease lifespan by dynamic decay rate
    this.lifespan -= this.lifespanDecayRate;

    this.acceleration.mult(0);
  }

  // Method to display
  show() {
    colorMode(HSB, 255);
    noStroke();
    // Calculate size based on remaining lifespan (shrinks as lifespan decreases)
    let size = map(this.lifespan, 0, 300, 0, this.maxSize);
    fill(this.color, 255, 255, this.lifespan); // Use HSB color for the particle
    circle(this.position.x, this.position.y, size);
  }

  // Check if the particle is out of bounds or has no lifespan left
  isDead() {
    return (
      this.lifespan < 0.0 || 
      this.position.x < 0 || this.position.x > width || 
      this.position.y < 0 || this.position.y > height
    );
  }
}

class SquareParticle extends Particle {
  constructor(x, y, color) {
    super(x, y, color); // Call the constructor of the parent class
  }

  // Override the show() method to display squares
  show() {
    colorMode(HSB, 255);

    // Calculate size based on remaining lifespan (shrinks as lifespan decreases)
    let size = map(this.lifespan, 0, 300, 0, this.maxSize);
    fill(this.color, 255, 255, this.lifespan); // Use HSB color for the particle
    rectMode(CENTER);
    rect(this.position.x, this.position.y, size, size); // Draw a square instead of a circle
  }
}

class TriangleParticle extends Particle {
  constructor(x, y, color) {
    super(x, y, color); // Call the constructor of the parent class
  }

  // Override the show() method to display triangles
  show() {
    colorMode(HSB, 255);

    // Calculate size based on remaining lifespan (shrinks as lifespan decreases)
    let size = map(this.lifespan, 0, 300, 0, this.maxSize);
    fill(this.color, 255, 255, this.lifespan); // Use HSB color for the particle
    noStroke();

    // Draw an equilateral triangle using three vertices
    let h = sqrt(3) / 2 * size; // Height of an equilateral triangle
    beginShape();
    vertex(this.position.x, this.position.y - h / 2); // Top vertex
    vertex(this.position.x - size / 2, this.position.y + h / 2); // Bottom left vertex
    vertex(this.position.x + size / 2, this.position.y + h / 2); // Bottom right vertex
    endShape(CLOSE);
  }
}

// Function to set the active item in the nav
function setActiveNav(element) {
    document.querySelectorAll('nav ul li a').forEach((link) => {
        link.classList.remove('active'); // Remove 'active' from all nav items
    });
    element.classList.add('active'); // Add 'active' to the clicked nav item
}

// Function to set the active particle type button
function setParticleType(button, type) {
    document.querySelectorAll('.control-bar button').forEach((btn) => {
        btn.classList.remove('active'); // Remove 'active' from all buttons
    });
    button.classList.add('active'); // Add 'active' to the clicked button

    // Call the corresponding particle change function
    if (type === 'circle') {
        key1Pressed();
    } else if (type === 'triangle') {
        key2Pressed();
    } else if (type === 'square') {
        key3Pressed();
    }
}
