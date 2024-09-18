const q$ = {
  elem: null,
  select(selector, element) {
    const mountElem = element || document;
    if (selector) this.elem = mountElem.querySelector(selector);
    return this;
  },
  selectAll(selector, element) {
    const mountElem = element || document;
    if (selector) this.elem = mountElem.querySelectorAll(selector);
    return this;
  },
  selectById(selector, element) {
    const mountElem = element || document;
    if (selector) this.elem = mountElem.getElementById(selector);
    return this;
  },
  modifyInnerHTML(content) {
    if (this.elem) {
      this.elem.innerHTML = content;
    }
    return this;
  },
  modifyInnerHTMLAll(content) {
    this.elem?.forEach((item) => {
      if (item) {
        item.innerHTML = content;
      }
    });
    return this;
  },
  addClass(...className) {
    this.elem?.classList?.add(...className);
    return this;
  },
  addClassAll(...className) {
    this.elem?.forEach((item) => item?.classList?.add(...className));
    return this;
  },
  removeClass(className) {
    this.elem?.classList?.remove(className);
    return this;
  },
  removeClassAll(className) {
    this.elem?.forEach((item) => item?.classList?.remove(className));
    return this;
  },
  modifyTextContent(content) {
    if (content && this.elem) {
      this.elem.textContent = content;
    }
    return this;
  },
  modifyTextContentAll(content) {
    if (content) {
      this.elem?.forEach((item) => {
        if (item) {
          item.textContent = content;
        }
      });
    }
    return this;
  },
  setAttribute(attrKey, attrVal) {
    if (attrKey && attrVal) {
      this.elem?.setAttribute(attrKey, attrVal);
    }
    return this;
  },
  setAttributeAll(attrKey, attrVal) {
    if (attrKey && attrVal) {
      this.elem?.forEach((item) => {
        item?.setAttribute(attrKey, attrVal);
      });
    }
    return this;
  },
  setStyleProperty(attrKey, attrVal, optional) {
    if (attrKey && attrVal) {
      this.elem?.style?.setProperty(attrKey, attrVal, optional);
    }
    return this;
  },
  setStylePropertyAll(attrKey, attrVal, optional) {
    if (attrKey && attrVal) {
      this.elem?.forEach((item) => {
        item?.style?.setProperty(attrKey, attrVal, optional);
      });
    }
    return this;
  },
  removeAttribute(attribute) {
    if (this?.elem && attribute) {
      this?.elem.removeAttribute(attribute);
    }
    return this;
  },
  removeAttributeAll(attribute) {
    if (attribute) {
      this.elem?.forEach((item) => {
        item?.removeAttribute(attribute);
      });
    }
    return this;
  },
  setDataAttribute(attrKey, attrVal) {
    if (attrKey && attrVal) {
      if (this.elem) {
        this.elem.dataset[attrKey] = attrVal;
      }
    }
    return this;
  },
  setDataAttributeAll(attrKey, attrVal) {
    if (attrKey && attrVal) {
      this.elem?.forEach((item) => {
        if (item) {
          item.dataset[attrKey] = attrVal;
        }
      });
    }
    return this;
  },
  getTemplateContent() {
    if (this.elem) {
      this.elem = document.importNode(this.elem.content, true);
    }
    return this;
  },
  appendChild(el) {
    if (this.elem && el) {
      this.elem.appendChild(el);
    }
    return this;
  },
};

const DIRECTIONS = {
  UP: 'UP',
  DOWN: 'DOWN',
  IDLE: 'IDLE',
};

const STATUS = {
  ACTIVE: 'ACTIVE',
  WAITING: 'WAITING',
  FULLFILLED: 'FULLFILLED',
};

let liftsMap = [],
  pendingReqeusts = [];

function processQueuedRequests(id) {
  const len = liftsMap[id]?.stops?.length || 0;
  if (len > 0) {
    liftsMap[id].stops.shift();
    if (len > 1) return handleStops(id);
  }

  liftsMap[id].direction = DIRECTIONS.IDLE;
  if (pendingReqeusts.length) {
    const request = pendingReqeusts[0];
    pendingReqeusts.shift();
    callLift(request.direction, request.floorNo);
  }
}

function openLift(id, direction, floorNo) {
  q$.select(`.lift-${id}`).addClass('open-lift');

  setTimeout(() => {
    q$.select(`.lift-${id}`).removeClass('open-lift');
    q$.select(`.button-${direction.toLowerCase()}-${floorNo}`)
      .removeClass('active')
      .setDataAttribute('status', STATUS.FULLFILLED);

    processQueuedRequests(id);
  }, 5000);
}

function moveLift(id, direction, floorNo) {
  let prevFloor = liftsMap[id].currentDestination;
  liftsMap[id].direction = direction;
  liftsMap[id].currentDestination = floorNo;

  let gap = liftsMap[id].activeFloor - floorNo;
  let diff = Math.abs(gap);
  let count = 0;

  if (prevFloor === floorNo) {
    openLift(id, direction, floorNo);
    return;
  }
  if (gap < 0) {
    liftsMap[id].pathDirection = DIRECTIONS.UP;
  } else {
    liftsMap[id].pathDirection = DIRECTIONS.DOWN;
  }

  q$.select(`.lift-${id}`)
    .setStyleProperty('transition', `transform ${diff * 2}s ease-in 0s`)
    .setStyleProperty('transform', `translateY(-${98 * (floorNo - 1)}px)`);

  liftsMap[id].floorInterval = setInterval(() => {
    count++;
    liftsMap[id].activeFloor +=
      liftsMap[id].pathDirection === DIRECTIONS.UP ? 1 : -1;
  }, 2000);

  liftsMap[id].openLiftTimeout = setTimeout(() => {
    clearInterval(liftsMap[id].floorInterval);
    openLift(id, direction, floorNo);
  }, diff * 2000);
}

function sortArray(arr, order) {
  if (order === 'asc') return arr.sort((a, b) => a - b);
  return arr.sort((a, b) => b - a);
}

function handleStops(id) {
  const stops = liftsMap[id].stops;
  // console.log({ stops, id });
  if (stops?.length && liftsMap[id].currentDestination !== stops?.[0]) {
    clearInterval(liftsMap[id].floorInterval);
    clearTimeout(liftsMap[id].openLiftTimeout);
    moveLift(id, liftsMap[id].direction, stops[0]);
  }
}

function callLift(direction, floorNo) {
  const button = q$.select(
    `.button-${direction.toLowerCase()}-${floorNo}`
  ).elem;
  if (
    button.classList.contains('active') &&
    button.dataset.status !== STATUS.WAITING
  ) {
    return;
  }
  button.classList.add('active');
  button.dataset.status = STATUS.ACTIVE;

  sortedMap = [...liftsMap].sort(
    (a, b) =>
      Math.abs(a.activeFloor - floorNo) - Math.abs(b.activeFloor - floorNo)
  );

  let lift = sortedMap.find((lift) => lift.direction === DIRECTIONS.IDLE);
  if (lift?.currentDestination === floorNo) {
    liftsMap[lift.id].direction = direction;
    openLift(lift.id, direction, floorNo);
    return;
  }

  if (direction === DIRECTIONS.UP) {
    let closestLiftFreeLift = sortedMap.find(
      (lift) => lift.direction === DIRECTIONS.IDLE
    );

    lift = sortedMap.find((lift) => lift.direction === DIRECTIONS.UP);

    if (lift) {
      flag = !lift?.stops;

      if (!lift.stops) {
        if (
          Math.abs((closestLiftFreeLift?.currentDestination || 0) - floorNo) >
            Math.abs(lift.currentDestination - floorNo) ||
          (floorNo > lift.activeFloor && floorNo < lift.currentDestination)
        ) {
          lift.stops = [floorNo, lift.currentDestination];
        }
      } else if (
        Math.abs((closestLiftFreeLift?.currentDestination || 0) - floorNo) >
          Math.abs(lift.stops[lift.stops.length - 1] - floorNo) ||
        (floorNo > lift.activeFloor && floorNo < lift.currentDestination)
      ) {
        lift.stops = [...lift.stops, floorNo];
      }

      if (lift?.stops?.length) {
        lift.stops = sortArray(lift.stops, 'asc');
        liftsMap[lift.id] = { ...lift };
        if (lift.stops.indexOf(floorNo) >= 0) {
          if (lift.stops[0] < lift.currentDestination)
            return handleStops(lift.id);
          return;
        }
      }

      lift = {};
    }
  } else if (direction === DIRECTIONS.DOWN) {
    lift = sortedMap.find((lift) => lift.direction === DIRECTIONS.DOWN);

    if (lift && lift.pathDirection === DIRECTIONS.DOWN) {
      flag = !lift?.stops;

      if (!lift.stops) {
        if (floorNo > lift.currentDestination) {
          lift.stops = [floorNo, lift.currentDestination];
        }
      } else if (floorNo > lift.currentDestination) {
        lift.stops = [...lift.stops, floorNo];
      }

      if (lift?.stops?.length) {
        lift.stops = sortArray(lift.stops, 'desc');
        liftsMap[lift.id] = { ...lift };

        if (lift.stops.indexOf(floorNo) >= 0) {
          if (lift.stops[0] > lift.currentDestination)
            return handleStops(lift.id);
          return;
        }
      }

      lift = {};
    }
  }

  lift = sortedMap.find((lift) => lift.direction === DIRECTIONS.IDLE);

  if (!lift) {
    pendingReqeusts.push({ direction, floorNo });
    button.dataset.status = STATUS.WAITING;
  } else {
    moveLift(lift.id, direction, floorNo);
  }
}

function renderLiftSystem(e) {
  e.preventDefault();
  liftsMap.forEach((lift) => {
    clearInterval(lift.floorInterval);
    clearTimeout(lift.openLiftTimeout);
  });
  liftsMap = [];
  pendingReqeusts = [];
  const form = e.currentTarget;
  const formValues = new FormData(form);
  const lifts = formValues.get('lift');
  const floors = formValues.get('floor');
  q$.select('.lift-system-section').removeClass('hidden');
  const wrapper = q$.select('.floors-wrapper').modifyInnerHTML('').elem;

  if (!lifts || !floors || !wrapper) return;

  for (let i = floors; i >= 1; i--) {
    const floor = q$
      .selectById('floor-template')
      .getTemplateContent()
      .addClass(`floor-${i}`).elem;

    q$.select('.floor-no', floor).modifyTextContent(i);
    q$.select('button.up', floor)
      .addClass(`button-up-${i}`)
      .setAttribute('onclick', `callLift('${DIRECTIONS.UP}',${i})`);
    q$.select('button.down', floor)
      .addClass(`button-down-${i}`)
      .setAttribute('onclick', `callLift('${DIRECTIONS.DOWN}',${i})`);

    if (i == 1) q$.select('button.down', floor).addClass('hidden');
    if (i == floors) q$.select('button.up', floor).addClass('hidden');

    wrapper.appendChild(floor);
  }

  q$.select('.lifts-wrapper').modifyInnerHTML('');
  for (let j = 0; j < lifts; j++) {
    liftsMap.push({
      id: j,
      direction: DIRECTIONS.IDLE,
      currentDestination: 1,
      activeFloor: 1,
    });
    const lift = q$.selectById('lift-template').getTemplateContent().elem;
    q$.select('.lift', lift).addClass(`lift-${j}`);
    q$.select('.lifts-wrapper').appendChild(lift);
  }
}
