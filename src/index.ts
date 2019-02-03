import { doesNotReject } from 'assert';
import { cpus } from 'os';
import { Stats } from 'webpack';

import { run } from './engine.ts';

const BORDER = 5;

const WINDOW_SIZE = [600, 600];
const [WINDOW_WIDTH, WINDOW_HEIGHT] = WINDOW_SIZE;

const PLAYER_SIZE = [130, 30];
const [PLAYER_WIDTH, PLAYER_HEIGHT] = PLAYER_SIZE;
const PLAYER_VELOCITY = 450; // point per millisecond

const BALL_RADIUS = 20;
const BALL_VELOCITY_INCREMENT = 50; // point per millisecond

const BACKGROUND_COLOR = 'rgba(199, 217, 229, 1)';
const PLAYER_COLOR = 'black';
const BALL_COLOR = 'black';

// tslint:disable:no-shadowed-variable

// type Winner = 'PLAYER1' | 'PLAYER2';

type Position = [number, number];
type Velocity = [number, number];

type State = {
  started: boolean;
  score: [number, number];
  player1Position: Position;
  player1Velocity: Velocity;
  player2Position: Position;
  player2Velocity: Velocity;
  // ballPosition: Position;
  // ballVelocity: Velocity;
  // time: number;
};

const createInitialState = (): State =>

  ({
    started: false,
    score: [0, 0],
    player1Position: [WINDOW_WIDTH / 2, (PLAYER_HEIGHT / 2) + BORDER],
    player1Velocity: [0, 0],
    player2Position: [WINDOW_WIDTH / 2, WINDOW_HEIGHT - (PLAYER_HEIGHT / 2) - BORDER],
    player2Velocity: [0, 0]
  });

const drawBackground = (context: CanvasRenderingContext2D) => {
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, WINDOW_SIZE[0], WINDOW_SIZE[1]);
  // context.fill();
};
const drawPlayer = (context: CanvasRenderingContext2D, playerPosition: [number, number]) => {
  const [playerWith, playerHeight] = PLAYER_SIZE;
  const [playerX, playerY] = playerPosition;

  context.fillStyle = PLAYER_COLOR;
  context.fillRect(playerX - (playerWith / 2), playerY - (playerHeight / 2), playerWith, playerHeight);
};

const updatePlayerPosition = ([positionX, positionY]: Position, [velocityX, velocityY]: Velocity, deltaTime: number): Position =>
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

const nextIAVelocity = ([velocityX, velocityY]: Velocity): Velocity => {
  // tslint:disable-next-line:insecure-random
  const seed = Math.random() * 100;
  if (seed > 30) { return [velocityX, velocityY]; }
  if (seed > 20) { return [velocityX, velocityY]; }
  if (seed > 15) { return [-PLAYER_VELOCITY, velocityY]; }
  if (seed > 10) { return [PLAYER_VELOCITY, velocityY]; }

  return [0, velocityY];
};

const draw = (state: State, context: CanvasRenderingContext2D, deltaTime: number): State => {
  const {
    // started,
    // score,
    player1Position,
    player1Velocity,
    player2Position,
    player2Velocity
  } = state;

  drawBackground(context);
  drawPlayer(context, player1Position);
  drawPlayer(context, player2Position);

  return {
    ...state,
    player1Position: contraintPlayerPosition(updatePlayerPosition(player1Position, player1Velocity, deltaTime)),
    player2Velocity: nextIAVelocity(player2Velocity),
    player2Position: contraintPlayerPosition(updatePlayerPosition(player2Position, player2Velocity, deltaTime); ),
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
