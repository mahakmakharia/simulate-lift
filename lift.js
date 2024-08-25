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

function openLift(id, direction, floorNo) {
  q$.select(`.lift-${id}`).addClass('open-lift');

  setTimeout(() => {
    q$.select(`.lift-${id}`).removeClass('open-lift');
    q$.select(`.button-${direction.toLowerCase()}-${floorNo}`)
      .removeClass('active')
      .setDataAttribute('status', STATUS.FULLFILLED);

    liftsMap[id - 1].direction = DIRECTIONS.IDLE;
    if (pendingReqeusts.length) {
      const request = pendingReqeusts[0];
      pendingReqeusts.shift();
      callLift(request.direction, request.floorNo);
    }
  }, 2500);
}

function moveLift(id, direction, floorNo) {
  let prevFloor = liftsMap[id - 1].currentFloor;
  liftsMap[id - 1].direction = direction;
  liftsMap[id - 1].currentFloor = floorNo;

  let diff = Math.abs(prevFloor - floorNo);
  if (prevFloor === floorNo) {
    openLift(id, direction, floorNo);
    return;
  }
  q$.select(`.lift-${id}`)
    .setStyleProperty('transition', `transform ${diff * 2}s ease-in 0s`)
    .setStyleProperty('transform', `translateY(-${96.5 * (floorNo - 1)}px)`);

  setTimeout(() => {
    openLift(id, direction, floorNo);
  }, diff * 2000);
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
      Math.abs(a.currentFloor - floorNo) - Math.abs(b.currentFloor - floorNo)
  );

  let lift = sortedMap.find((lift) => lift.direction === DIRECTIONS.IDLE);

  if (!lift) {
    pendingReqeusts.push({ direction, floorNo });
    button.dataset.status = STATUS.WAITING;
  } else {
    moveLift(lift.id, direction, floorNo);
  }
}

function renderLiftSystem(e) {
  e.preventDefault();
  liftsMap = [];
  const form = e.currentTarget;
  const formValues = new FormData(form);
  const lifts = formValues.get('lift');
  const floors = formValues.get('floor');
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
    wrapper.appendChild(floor);
  }

  q$.select('.lifts-wrapper').modifyInnerHTML('');
  for (let j = 1; j <= lifts; j++) {
    liftsMap.push({ id: j, direction: DIRECTIONS.IDLE, currentFloor: 1 });
    const lift = q$.selectById('lift-template').getTemplateContent().elem;
    q$.select('.lift', lift).addClass(`lift-${j}`);
    q$.select('.lifts-wrapper').appendChild(lift);
  }
}
