#include <cstdlib>
#include <ctime>
#include <iostream>
#include <emscripten/emscripten.h>
#include <cmath>

using namespace std;

class Vector2 {
  public:
    float x;
    float y;

    Vector2(float _x, float _y) {
      x = _x;
      y = _y;
    }

    float getLength() {
      return sqrt(pow(x, 2) + pow(y, 2));
    }

    Vector2 * add(Vector2 * vec) {
      x += vec->x;
      y += vec->y;

      return this;
    }

    Vector2 * multiply(float value) {
      x *= value;
      y *= value;

      return this;
    }

    Vector2 * subtract(Vector2 * vec2) {
      x -= vec2->x;
      y -= vec2->y;

      return this;
    }

    Vector2 * normalize() {
      float normX = x / getLength(),
          normY = y / getLength();

      x = normX;
      y = normY;

      return this;
    }

    static Vector2 * subtract(Vector2 * vec1, Vector2 * vec2) {
      return (new Vector2(vec1->x, vec1->y))->subtract(vec2);
    }
};

class Particle {
  public:
    Vector2 * position;
    Vector2 * velocity;
    float friction;

    Particle(Vector2 * _position) {
      position = _position;
      velocity = new Vector2(0, 0);
      friction = 1.001;
    }

    ~Particle() {
      delete position;
      delete velocity;
    }

    void addForce(float x, float y) {
      velocity->x += x;
      velocity->y += y;
    }

    void move() {
      position->add(velocity->multiply(1/friction));
    }
};

Particle ** particles;
float * particlesCoordinates;
int particlesNum = 0;
int heavyParticlesNum = 0;
Vector2 ** heavyParticles;

#ifdef __cplusplus
extern "C" {
#endif
  EMSCRIPTEN_KEEPALIVE void deleteParticles() {
    if (particles && particlesNum > 0) {
      for (int i = 0; i < particlesNum; i++) {
        delete particles[i];
      }

      delete particles;

      particlesNum = 0;

      delete particlesCoordinates;
    }
  }

  EMSCRIPTEN_KEEPALIVE void createParticles(int number, float centerX, float centerY, float radius, float forceStrength) {
    deleteParticles();

    particlesNum = number;

    srand(time(nullptr));
    float r, phi, x, y;
    Vector2 * force;
    Vector2 * center = new Vector2(centerX, centerY);

    particles = new Particle*[number];

    for (int i = 0; i < number; i++) {
      r = sqrt(((float) rand() / (RAND_MAX))) * radius;
      phi = ((float) rand() / (RAND_MAX)) * 2 * M_PI;
      x = r * sin(phi);
      y = r * cos(phi);

      particles[i] = new Particle((new Vector2(x, y))->add(center));

      force = Vector2::subtract(particles[i]->position, center)->multiply(forceStrength);

      particles[i]->addForce(force->x, force->y);

      delete force;
    }

    particlesCoordinates = new float[2 * number];

    delete center;
  }

  EMSCRIPTEN_KEEPALIVE void deleteHeavyParticles() {
    if (heavyParticles && heavyParticlesNum > 0) {
      for (int i = 0; i < heavyParticlesNum; i++) {
        delete heavyParticles[i];
      }

      delete heavyParticles;

      heavyParticlesNum = 0;
    }
  }

  EMSCRIPTEN_KEEPALIVE void createHeavyParticles(int number, float canvasWidth, float canvasHeight) {
    deleteHeavyParticles();

    heavyParticlesNum = number;

    heavyParticles = new Vector2*[number];

    float x, y;

    float radius = canvasHeight / 4;

    if (number == 1) {
      heavyParticles[0] = new Vector2(canvasWidth / 2, canvasHeight / 2);

      return;
    }

    for (int i = 0; i < number; i++ ) {
      if (number % 2) {
        x = canvasWidth / 2 + radius * cos(M_PI / 2 + 2 * M_PI * (i + 0.5) / number);
        y = canvasHeight / 2 + radius * sin(M_PI / 2 + 2 * M_PI * (i + 0.5) / number);
      } else {
        x = canvasWidth / 2 + radius * cos(M_PI / number + 2 * M_PI * i / number);
        y = canvasHeight / 2 + radius * sin(M_PI / number + 2 * M_PI * i / number);
      }

      heavyParticles[i] = new Vector2(x, y);
    }
  }

  EMSCRIPTEN_KEEPALIVE void respawn(float centerX, float centerY, float radius, float forceStrength) {
    srand(time(nullptr));

    float r, phi, x, y;
    Vector2 * force;
    Vector2 * center = new Vector2(centerX, centerY);

    for (int i = 0; i < particlesNum; i++) {
      r = sqrt(((float) rand() / (RAND_MAX))) * radius;
      phi = ((float) rand() / (RAND_MAX)) * 2 * M_PI;
      x = r * sin(phi);
      y = r * cos(phi);

      particles[i]->position->x = x + centerX;
      particles[i]->position->y = y + centerY;
      particles[i]->velocity->x = 0;
      particles[i]->velocity->y = 0;

      force = Vector2::subtract(particles[i]->position, center)->multiply(forceStrength);

      particles[i]->addForce(force->x, force->y);

      delete force;
    }

    delete center;
  }

  EMSCRIPTEN_KEEPALIVE void spawnEmpty(float centerX, float centerY, float radius, float width, float forceStrength) {
    srand(time(nullptr));

    float r, phi, x, y;
    Vector2 * force;
    Vector2 * center = new Vector2(centerX, centerY);

    for (int i = 0; i < particlesNum; i++) {
      r = sqrt(((float) rand() / (RAND_MAX))) * width + radius - width;
      phi = ((float) rand() / (RAND_MAX)) * 2 * M_PI;
      x = r * sin(phi);
      y = r * cos(phi);

      particles[i]->position->x = x + centerX;
      particles[i]->position->y = y + centerY;
      particles[i]->velocity->x = 0;
      particles[i]->velocity->y = 0;

      force = Vector2::subtract(particles[i]->position, center);
      force = force->multiply(1 / force->getLength())->multiply(forceStrength);

      particles[i]->addForce(force->x, force->y);

      delete force;
    }

    delete center;
  }

  EMSCRIPTEN_KEEPALIVE void stop() {
    for (int i = 0; i < particlesNum; i++) {
      particles[i]->velocity->x = 0;
      particles[i]->velocity->y = 0;
    }
  }

  EMSCRIPTEN_KEEPALIVE void explosion(float centerX, float centerY, float explosionForce) {
    Vector2 * force;
    Vector2 * center = new Vector2(centerX, centerY);

    for (int i = 0; i < particlesNum; i++) {
        force = Vector2::subtract(particles[i]->position, center);
        force = force->multiply(1 / force->getLength())->multiply(explosionForce);
        particles[i]->addForce(force->x, force->y);

        delete force;
    }

    delete center;
  }

  EMSCRIPTEN_KEEPALIVE float* calcCoordinates (float canvasWidth, float canvasHeight, float particleSize, int isForceApplied, float forceCenterX, float forceCenterY, float deltaTime, int bounceX, int bounceY, int squared) {
    float normX, normY, length;
    float particleX, particleY;
    float forceMagnitude;
    Particle * particle;
    int leftBound = 0;
    int rightBound = canvasWidth;


    if (squared == 1) {
      leftBound = (canvasWidth - canvasHeight) / 2;
      rightBound = canvasWidth - (canvasWidth - canvasHeight) / 2;
    }

    for (int i = 0; i < particlesNum; i++) {
      particle = particles[i];
      particleX = particle->position->x;
      particleY = particle->position->y;

      normX = -1.0 + 2.0 * particleX / canvasWidth;
      normY = -1.0 + 2.0 * particleY / canvasHeight;

      particlesCoordinates[2*i] = normX;
      particlesCoordinates[2*i + 1] = normY;

      if (bounceX == 1) {
        if (((particleX - particleSize / 2) < leftBound && particle->velocity->x < 0) || ((particleX + particleSize / 2) > rightBound && particle->velocity->x > 0)) {
          particle->velocity->x = -particle->velocity->x;
        }
      }

      if (bounceY == 1) {
        if (((particleY - particleSize / 2) < 0 && particle->velocity->y < 0) || ((particleY + particleSize / 2) > canvasHeight && particle->velocity->y > 0)) {
          particle->velocity->y = -particle->velocity->y;
        }
      }

      if (isForceApplied == 1) {
        length = sqrt(pow(forceCenterX - particleX, 2) + pow(forceCenterY - particleY, 2));

        forceMagnitude = 0.07 * (1 / length);

        particle->addForce(
          forceMagnitude * (forceCenterX - particleX),
          forceMagnitude * (forceCenterY - particleY)
        );
      }

      for (int j = 0; j < heavyParticlesNum; j++) {
        length = sqrt(pow(heavyParticles[j]->x - particleX, 2) + pow(heavyParticles[j]->y - particleY, 2));

        forceMagnitude = 0.07 * (1 / length);

        particle->addForce(
          forceMagnitude * (heavyParticles[j]->x - particleX),
          forceMagnitude * (heavyParticles[j]->y - particleY)
        );
      }

      particle->move();
    };

    auto arrayPtr = &particlesCoordinates[0];
    return arrayPtr;
  }
#ifdef __cplusplus
}
#endif
