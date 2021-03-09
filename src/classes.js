export class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  getLength() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  add(vec2) {
    this.x += vec2.x;
    this.y += vec2.y;

    return this;
  }

  multiply(value) {
    this.x *= value;
    this.y *= value;

    return this;
  }

  subtract(vec2) {
    this.x -= vec2.x;
    this.y -= vec2.y;

    return this;
  }

  normalize(vec2) {
    var x = this.x / this.getLength(),
      y = this.y / this.getLength();

    this.x = x;
    this.y = y;

    return this;
  }

  static subtract(vec1, vec2) {
    return (new Vector2(vec1.x, vec1.y)).subtract(vec2);
  }

  static normalize(vec) {
    var x = vec.x / vec.getLength(),
      y = vec.y / vec.getLength();

    return new Vector2(x, y);
  }

}

export class Particle {
  constructor(position) {
    this.position = position;
    this.velocity = new Vector2(0, 0);
    this.prevPoisitons = [];
    this.friction = 1.001;
  }

  addForce(force) {
    this.velocity.add(force);
  }

  move() {
    this.position.add(this.velocity.multiply(1/this.friction));
  }
}

