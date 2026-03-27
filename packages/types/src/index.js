"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerState = void 0;
var TimerState;
(function (TimerState) {
    TimerState["IDLE"] = "IDLE";
    TimerState["READY"] = "READY";
    TimerState["WARMUP_RUNNING"] = "WARMUP_RUNNING";
    TimerState["WARMUP_PAUSED"] = "WARMUP_PAUSED";
    TimerState["ROUND_RUNNING"] = "ROUND_RUNNING";
    TimerState["ROUND_PAUSED"] = "ROUND_PAUSED";
    TimerState["FINISH_PENDING_CONFIRMATION"] = "FINISH_PENDING_CONFIRMATION";
    TimerState["COMPLETED"] = "COMPLETED";
    TimerState["ABORTED"] = "ABORTED";
    TimerState["HOLD"] = "HOLD";
})(TimerState || (exports.TimerState = TimerState = {}));
