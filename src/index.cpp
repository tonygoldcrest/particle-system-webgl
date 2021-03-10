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
int particlesNum;

#ifdef __cplusplus
extern "C" {
#endif
  EMSCRIPTEN_KEEPALIVE void createParticles(int number, float centerX, float centerY) {
    particlesNum = number;

    srand(time(nullptr));
    float r, phi, x, y;
    Vector2 * force;
    Vector2 * center = new Vector2(centerX, centerY);

    particles = new Particle*[number];

    for (int i = 0; i < number; i++) {
      r = ((float) rand() / (RAND_MAX)) * 200;
      phi = ((float) rand() / (RAND_MAX)) * 2 * M_PI;
      x = r * sin(phi);
      y = r * cos(phi);

      particles[i] = new Particle((new Vector2(x, y))->add(center));

      force = Vector2::subtract(particles[i]->position, center)->multiply(0.05);

      particles[i]->addForce(force->x, force->y);
    }

    particlesCoordinates = new float[3 * number];
  }

  EMSCRIPTEN_KEEPALIVE float* calcCoordinates (float canvasWidth, float canvasHeight, int opacityReductionNumber, int isMouseDown, float mousePositionX, float mousePositionY, float deltaTime) {
    float normX, normY, length;
    float particleX, particleY;
    float forceMagnitude;
    Particle * particle;

    for (int i = 0; i < particlesNum; i++) {
      particle = particles[i];
      particleX = particle->position->x;
      particleY = particle->position->y;

      normX = -1.0 + 2.0 * particleX / canvasWidth;
      normY = -1.0 + 2.0 * particleY / canvasHeight;

      particlesCoordinates[3*i] = normX;
      particlesCoordinates[3*i + 1] = normY;
      particlesCoordinates[3*i + 2] = 1.0 / opacityReductionNumber;

      if (particleX < 0 || particleX > canvasWidth) {
        particle->velocity->x = -particle->velocity->x;
      }

      if (particleY < 0 || particleY > canvasHeight) {
        particle->velocity->y = -particle->velocity->y;
      }

      if (isMouseDown == 1) {
        length = sqrt(pow(mousePositionX - particleX, 2) + pow(mousePositionY - particleY, 2));

        forceMagnitude = deltaTime * 100 * (1 / length);

        particle->addForce(
          forceMagnitude * (mousePositionX - particleX),
          forceMagnitude * (mousePositionY - particleY)
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
