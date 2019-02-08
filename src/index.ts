import { doesNotReject } from 'assert';
import { cpus } from 'os';
import { Stats } from 'webpack';

import { run } from './engine';

type Position = [number, number];
type Velocity = [number, number];
type Dimension = [number, number];

type State = {
  started: boolean;
  score: [number, number];
  player1Position: Position;
  player1Velocity: Velocity;
  player2Position: Position;
  player2Velocity: Velocity;
  ballPosition: Position;
  ballVelocity: Velocity;
  // time: number;
};

const BORDER = 5;

const WINDOW_SIZE: Dimension = [600, 600];
const [WINDOW_WIDTH, WINDOW_HEIGHT] = WINDOW_SIZE;

const PLAYER_SIZE: Dimension = [130, 30];
const [PLAYER_WIDTH, PLAYER_HEIGHT] = PLAYER_SIZE;
const PLAYER_VELOCITY = 450; // point per millisecond

const BALL_RADIUS = 20;
const BALL_VELOCITY_X = 0.8;
const BALL_VELOCITY_Y_INCREMENT = 50; // point per millisecond

const BACKGROUND_COLOR = 'rgba(199, 217, 229, 1)';
const PLAYER_COLOR = 'black';
const BALL_COLOR = 'black';

// tslint:disable:no-shadowed-variable

// type Winner = 'PLAYER1' | 'PLAYER2';

const createInitialState = (): State =>

  ({
    started: false,
    score: [0, 0],
    player1Position: [WINDOW_WIDTH / 2, (PLAYER_HEIGHT / 2) + BORDER],
    player1Velocity: [0, 0],
    player2Position: [WINDOW_WIDTH / 2, WINDOW_HEIGHT - (PLAYER_HEIGHT / 2) - BORDER],
    player2Velocity: [0, 0],
    ballPosition: [WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2],
    ballVelocity: [200, 200]
  });

const drawBackground = (context: CanvasRenderingContext2D) => {
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, WINDOW_SIZE[0], WINDOW_SIZE[1]);
  context.fill();
};
const drawPlayer = (context: CanvasRenderingContext2D, playerPosition: [number, number]) => {
  const [playerWith, playerHeight] = PLAYER_SIZE;
  const [playerX, playerY] = playerPosition;

  context.fillStyle = PLAYER_COLOR;
  context.fillRect(playerX - (playerWith / 2), playerY - (playerHeight / 2), playerWith, playerHeight);
};

const drawBall = (context: CanvasRenderingContext2D, ballPosition: [number, number]) => {
  const [ballX, ballY] = ballPosition;

  context.fillStyle = BALL_COLOR;
  context.beginPath();
  context.ellipse(ballX, ballY, BALL_RADIUS, BALL_RADIUS, 0, 0, Math.PI * 2);
  context.fill();
};

const updatePosition = ([positionX, positionY]: Position, [velocityX, velocityY]: Velocity, deltaTime: number): Position =>
  [
    positionX + (velocityX * deltaTime),
    positionY + (velocityY * deltaTime)
  ];

const CONTRAINT_PLAYER_POSITION_X_MAX = WINDOW_WIDTH - (PLAYER_WIDTH / 2) - BORDER;
const CONTRAINT_PLAYER_POSITION_X_MIN = (PLAYER_WIDTH / 2) + BORDER;
const contraintPlayerPosition = ([playerPositionX, playerPositionY]: Position): Position =>
  [
    Math.max(
      Math.min(
        playerPositionX,
        CONTRAINT_PLAYER_POSITION_X_MAX
      ),
      CONTRAINT_PLAYER_POSITION_X_MIN
    ),
    playerPositionY
  ];

const CONTRAINT_BALL_POSITION_X_MAX = WINDOW_WIDTH - BALL_RADIUS - BORDER;
const CONTRAINT_BALL_POSITION_X_MIN = BALL_RADIUS + BORDER;
const CONTRAINT_BALL_POSITION_Y_MAX = WINDOW_WIDTH - BALL_RADIUS - BORDER;
const CONTRAINT_BALL_POSITION_Y_MIN = BALL_RADIUS + BORDER;
const contraintBallPosition = ([ballPositionX, ballPositionY]: Position): Position =>
  [
    ballPositionX,
    ballPositionY
  ];

const nextIAVelocity = ([velocityX, velocityY]: Velocity): Velocity => {
  // tslint:disable-next-line:insecure-random
  const seed = Math.random() * 100;
  if (seed > 30) { return [velocityX, velocityY]; }
  if (seed > 20) { return [velocityX, velocityY]; }
  if (seed > 15) { return [-PLAYER_VELOCITY, velocityY]; }
  if (seed > 10) { return [PLAYER_VELOCITY, velocityY]; }

  return [0, velocityY];
};

type Rectangle = {
  center: Position;
  dimension: Dimension;
};
type Circle = {
  center: Position;
  radius: number;
};

const intersectPointCircle = (point: Position, circle: Circle): boolean => {
  const [pointX, pointY] = point;
  const {
    center: [circleX, circleY],
    radius
  } = circle;

  const [deltaX, deltaY] = [pointX - circleX, pointY - circleY];

  return (deltaX * deltaX + deltaY * deltaY) < (radius * radius);
};
const intersectRectangleCircle = (rectangle: Rectangle, circle: Circle): boolean => {
  const {
    center: [rectangleX, rectangleY],
    dimension: [rectangleWidth, rectangleHeight]
  } = rectangle;
  const {
    center: [circleX, circleY],
    radius
  } = circle;

  const [nearestX, nearestY] = [
    Math.max(rectangleX - (rectangleWidth / 2), Math.min(rectangleX + (rectangleWidth / 2), circleX)),
    Math.max(rectangleY - (rectangleHeight / 2), Math.min(rectangleY + (rectangleHeight / 2), circleY))
  ];

  return intersectPointCircle([nearestX, nearestY], circle);
};

const draw = (state: State, context: CanvasRenderingContext2D, deltaTime: number): State => {
  const {
    // started,
    // score,
    player1Position,
    player1Velocity,
    player2Position,
    player2Velocity,
    ballPosition
  } = state;
  let {
    ballVelocity
  } = state;

  drawBackground(context);
  drawPlayer(context, player1Position);
  drawPlayer(context, player2Position);
  drawBall(context, ballPosition);

  let newBallPosition = updatePosition(ballPosition, ballVelocity, deltaTime);
  let newPlayer1Position = contraintPlayerPosition(updatePosition(player1Position, player1Velocity, deltaTime));
  let newPlayer2Position = contraintPlayerPosition(updatePosition(player2Position, player2Velocity, deltaTime));

  // if (intersectRectangleCircle(
  //   { center: player1Position, dimension: [PLAYER_HEIGHT, PLAYER_WIDTH] },
  //   { center: ballPosition, radius: BALL_RADIUS }
  // )) {
  //   debugger;
  // }

  const leftBorder: Rectangle = { center: [0, WINDOW_HEIGHT / 2], dimension: [0, WINDOW_HEIGHT] };
  const rightBorder: Rectangle = { center: [WINDOW_WIDTH, WINDOW_HEIGHT / 2], dimension: [0, WINDOW_HEIGHT] };
  const ball: Circle = { center: newBallPosition, radius: BALL_RADIUS };
  const player1: Rectangle = { center: newPlayer1Position, dimension: [PLAYER_WIDTH, PLAYER_HEIGHT] };
  const player2: Rectangle = { center: newPlayer2Position, dimension: [PLAYER_WIDTH, PLAYER_HEIGHT] };

  if (intersectRectangleCircle(leftBorder, ball) || intersectRectangleCircle(rightBorder, ball)) {
    const [ballVelocityX, ballVelocityY] = ballVelocity;
    ballVelocity = [-ballVelocityX, ballVelocityY];
    newBallPosition = ballPosition;
  }
  const upBorder: Rectangle = { center: [WINDOW_WIDTH / 2, 0], dimension: [WINDOW_WIDTH, 0] };
  const downBorder: Rectangle = { center: [WINDOW_WIDTH / 2, WINDOW_HEIGHT], dimension: [WINDOW_WIDTH, 0] };
  if (intersectRectangleCircle(upBorder, ball) || intersectRectangleCircle(downBorder, ball)) {
    const [ballVelocityX, ballVelocityY] = ballVelocity;
    ballVelocity = [ballVelocityX, -ballVelocityY];
    newBallPosition = ballPosition;
  }

  if (intersectRectangleCircle(player1, ball)) {
    const [ballPositionX] = ballPosition;
    const [player1PositionX] = player1Position;
    const [, ballVelocityY] = ballVelocity;
    const distance = Math.abs(ballPositionX - player1PositionX);

    ballVelocity = [
      (ballPositionX < player1PositionX ? -distance * BALL_VELOCITY_X : distance * BALL_VELOCITY_X),
      -(ballVelocityY)
    ];
    newBallPosition = ballPosition;
    newPlayer1Position = player1Position;
  }
  if (intersectRectangleCircle(player2, ball)) {
    const [ballPositionX] = ballPosition;
    const [player2PositionX] = player2Position;
    const [, ballVelocityY] = ballVelocity;
    const distance = Math.abs(ballPositionX - player2PositionX);

    ballVelocity = [
      (ballPositionX < player2PositionX ? -distance * BALL_VELOCITY_X : distance * BALL_VELOCITY_X),
      -(ballVelocityY + BALL_VELOCITY_Y_INCREMENT)
    ];
    newBallPosition = ballPosition;
    newPlayer2Position = player2Position;
  }

  return {
    ...state,
    player1Position: newPlayer1Position,
    player2Velocity: nextIAVelocity(player2Velocity),
    player2Position: newPlayer2Position,
    ballPosition: newBallPosition,
    ballVelocity
  };
};

const onKey = (state: State, eventName: 'keyup' | 'keydown', keyCode: string): State => {
  const [player1VelocityX] = state.player1Velocity;
  switch (eventName) {
    case 'keydown': {
      switch (keyCode) {
        case 'ArrowRight': {
          return { ...state, player1Velocity: [PLAYER_VELOCITY, 0] };
        }
        case 'ArrowLeft': {
          return { ...state, player1Velocity: [-PLAYER_VELOCITY, 0] };
        }
        default:
          return state;
      }
    }
    case 'keyup': {
      switch (keyCode) {
        case 'ArrowRight': {
          return { ...state, player1Velocity: [player1VelocityX < 0 ? player1VelocityX : 0, 0] };
        }
        case 'ArrowLeft': {
          return { ...state, player1Velocity: [player1VelocityX > 0 ? player1VelocityX : 0, 0] };
        }
        default:
          return state;
      }
    }
    default:
      return state;
  }
};

const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 600;

document.body.appendChild(canvas);
run(createInitialState, draw, onKey, canvas);

// if (module.hot) {
//   module.hot.accept();
// }
