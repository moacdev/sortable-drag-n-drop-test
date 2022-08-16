import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

/////////////////////////
/* Draggable component */
/////////////////////////
var longPress;
var renderChildren;

//////////////////////////////
/* Masonry layout component */
//////////////////////////////

function DraggableMasonryLayout(props) {
  // General
  const [items, setItems] = useState(() =>
    props.children.map((child, index) => {
      console.log("init item");
      return {
        index: index,
        id: child.key,
        order: index
      };
    })
  );
  const [cursorPosX, setCursorPosX] = useState(undefined)
  const [cursorPosY, setCursorPosY] = useState(undefined)
  const [lastRearrangedItemId, setLastRearrangedItemId] = useState();
  const [isRearranges, setIsRearranges] = useState(false);
  // Touch events
  const [isTouch, setIsTouch] = useState(false);
  // Drag events
  const [dragItem, setDragItem] = useState();
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 });

  /////////////////////
  /* Events' methods */
  /////////////////////

  const getItemById = id => {
    // Return object with required id from items array
    let indexOfItem;
    for (var i = 0, len = props.children.length; i < len; i++) {
      if (items[i].id === id) {
        indexOfItem = i;
        break;
      }
    }
    // not support IE8
    // let indexOfItem = items.findIndex(item => item.id === id);
    return items[indexOfItem];
  };

  const initDrag = (cursor, item) => {
    /* Initialize dragging via assigning dragPoint and dragItem
    Require arguments: 
      cursor: {x, y} // clientX, clientY of a mouse or a touch
      item: {id, content, order} // Objects from items array
    */
    let dragElementWrapper = document.getElementById(`${item.id}-wrapper`);
    setDragPoint({
      x: cursor.x - dragElementWrapper.offsetLeft,
      y: cursor.y - dragElementWrapper.offsetTop
    });
    setDragItem(item);
  };

  const rearrangeItems = overItem => {
    var newItems;
    var newOrder = [];
    if (overItem !== dragItem && !isRearranges) {
      items.forEach((item, index) => {
        newOrder[index] = item.order; // Item is out of range. Keep same order
        // Override for items need to be changed
        if (dragItem.order < overItem.order) {
          // Drag toward the end
          if (item.order > dragItem.order && item.order <= overItem.order)
            // Inbetween notes. Replace on one to the start
            newOrder[index] = item.order - 1;
          if (item.order === dragItem.order)
            // Assign new order to the draggable
            newOrder[index] = overItem.order;
        }
        if (dragItem.order > overItem.order) {
          // Drag toward the start
          if (item.order < dragItem.order && item.order >= overItem.order)
            // Inbetween notes. Replace on one to the end
            newOrder[index] = item.order + 1;
          if (item.order === dragItem.order)
            // Assign new order to the draggable
            newOrder[index] = overItem.order;
        }
      });
      newItems = items.map((item, index) => {
        item.order = newOrder[index];
        return item;
      });
      setItems(newItems);
      setIsRearranges(true);
    }
    setLastRearrangedItemId(!isRearranges && overItem.id);
  };

  const cleanupDrag = () => {
    setDragItem(undefined);
    setLastRearrangedItemId(undefined);
    setCursorPosX(undefined);
    setCursorPosY(undefined);
    setDragPoint(undefined);
  };

  //////////////////////////
  /* Touch screens events */
  //////////////////////////

  const onTouchStart = e => {
    e.preventDefault && e.preventDefault();
    const touchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const fingers = e.touches.length;
    setIsTouch(true);
    setCursorPosX(touchPos.x);
    setCursorPosY(touchPos.y);
    longPress =
      fingers === 1 &&
      setTimeout(() => {
        e.preventDefault();
        let touchElement = document.elementFromPoint(touchPos.x, touchPos.y);
        initDrag(
          { x: touchPos.x, y: touchPos.y },
          getItemById(touchElement.id.replace("-draggable", ""))
        );
      }, 500);
  };

  const onTouchMove = e => {
    e.preventDefault && e.preventDefault();
    !dragItem && clearTimeout(longPress);
    setCursorPosX(e.touches[0].clientX);
    setCursorPosY(e.touches[0].clientY);
    let overObjectId = document.elementFromPoint(
      e.touches[0].clientX,
      e.touches[0].clientY
    ).id;
    if (
      overObjectId &&
      overObjectId.includes("draggable") &&
      dragItem &&
      lastRearrangedItemId !== overObjectId
    ) {
      let overTouchItem = getItemById(overObjectId.replace("-draggable", ""));
      rearrangeItems(overTouchItem);
    }
  };

  const onTouchEnd = e => {
    !dragItem && clearTimeout(longPress); // Cancel drag event for touch scn
    dragItem && cleanupDrag();
    setIsTouch(false);
  };

  //////////////////
  /* Mouse events */
  //////////////////

  useEffect(() => {
    document.addEventListener("dragover", onDragOverSpace);
    return () => document.removeEventListener("dragover", onDragOverSpace);
  }, []);

  const onDragStart = (e, item) => {
    console.log("drag start", item);
    isTouch && e.preventDefault();
    setCursorPosX(e.clientX);
    setCursorPosY(e.clientY);
    !isTouch && initDrag({ x: e.clientX, y: e.clientY }, item);
  };

  const onDragOverItem = (e, overItem) => {
    if (e.preventDefault) {
      e.preventDefault(); // Necessary. Allows us to drop.
    }
    rearrangeItems(overItem);
  };


  const onDragOverSpace = e => {
    setCursorPosX(e.clientX)
    setCursorPosY(e.clientY)
    // setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const onDragEnd = (e, note) => {
    // Cleanup after dragging
    cleanupDrag();
  };

  ///////////////////////////
  /* Prepare render values */
  ///////////////////////////

  let ghost; // Setup ghost on render
  if (dragItem) {
    let pos = {
      x: cursorPosX - dragPoint.x - window.scrollX,
      y: cursorPosY - dragPoint.y - window.scrollY
    };
    ghost = React.cloneElement(renderChildren[dragItem.index], {
      style: {
        position: "fixed",
        visibility: "visible",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        pointerEvents: "none"
      }
    });
    // ghost = React.cloneElement(props.children[dragItem.index], {
    //   ghost: "true",
    //   className: "note ghost",
    //   style: {
    //     ...props.children[dragItem.index].props.style,
    //     pointerEvents: "none",
    //     margin: 0,
    //     position: "fixed",
    //     transform: `translate(${pos.x}px, ${pos.y}px)`,
    //     zIndex: 3
    //   }
    // });
  }

  ////////////////////
  /* Masonry Layout */
  ////////////////////

  const [columns, setColumns] = useState(0);
  const [transition, setTransition] = useState(false);
  const [layout, setLayout] = useState({
    elements: [],
    width: 0,
    height: 0,
    endline: {
      start: { x: undefined, y: undefined },
      end: { x: undefined, y: undefined },
      byColumns: [],
      enterEvent: {
        elementsNum: 0,
        eventHandler: props.onEndlineEnter && props.onEndlineEnter
      }
    }
  });
  const [onErrorCount, setOnErrorCount] = useState(0);
  const [onLoadCount, setOnLoadCount] = useState(0);

  const masonryLayout = useRef(); // Top wrapper
  const endlineStartRef = useRef(); // Endline start sensor
  const endlineEndRef = useRef(); // Endline end sensor

  useEffect(() => {
    // Mount and unmount only
    // Add/remove event listeners
    checkLayout();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleResize = evt => {
    checkLayout(evt);
  };

  const checkLayout = evt => {
    const wrapperWidth = masonryLayout.current.offsetWidth;
    let cardWrapperWidth = document.getElementById(`${items[0].id}-wrapper`)
      .offsetWidth;
    setColumns(Math.floor(wrapperWidth / cardWrapperWidth));
    // turn on transition if window resizing
    setTransition(evt !== undefined);
  };

  const handleScroll = e => {
    checkEndlineEnterEvent();
  };

  const checkEndlineEnterEvent = () => {
    setLayout(layout => {
      if (
        endlineStartRef.current &&
        endlineStartRef.current.getBoundingClientRect().top -
        window.innerHeight <=
        0 &&
        layout.endline.enterEvent.elementsNum !== layout.elements.length
      ) {
        // enter endline event
        layout.endline.enterEvent.elementsNum = layout.elements.length;
        // execute enter endline event handler
        layout.endline.enterEvent.eventHandler &&
          layout.endline.enterEvent.eventHandler();
      }
      return layout;
    });
  };

  useEffect(() => {
    // component did mount or update
    if (masonryLayout.current.offsetHeight > 0) {
      // if layout rendered
      checkEndlineEnterEvent();
      setTransition(true);
    }
  });

  useEffect(() => {
    // if number of children changed
    setTransition(() => {
      if (props.children.length > layout.elements.length) {
        // disable transition for infinite scroll
        return false;
      } else if (props.children.length === layout.elements.length) {
        // enable for creation or change
        return true;
      } else if (props.children.length < layout.elements.length) {
        // enable for deletion
        return true;
      }
    });
  }, [props.children.length]);

  useEffect(() => {
    // set layout
    var elements = [];
    var endline = layout.endline;
    var cardWrapperWidth;
    endline.byColumns = [];
    for (let i = 0; i < columns; i++) {
      endline.byColumns[i] = 0;
    }
    let itemsSortedByOrder = items.concat().sort((a, b) => a.order - b.order);
    itemsSortedByOrder.forEach((item, index) => {
      // Calculate positions of each element
      let cardWrapperElement = document.getElementById(`${item.id}-wrapper`);
      let cardElement = document.getElementById(item.id);
      let height = cardWrapperElement.offsetHeight;
      cardWrapperWidth = cardWrapperElement.offsetWidth;
      let leastNum = Math.min(...endline.byColumns);
      let leastNumIndex = endline.byColumns.indexOf(leastNum);
      let x = leastNumIndex * cardWrapperWidth;
      let y = endline.byColumns[leastNumIndex];
      let cardWidth = cardElement.offsetWidth;
      let cardHeight = cardElement.offsetHeight;
      let cardOffsetLeft = cardElement.offsetLeft;
      let cardOffsetTop = cardElement.offsetTop;
      elements[item.index] = {
        x,
        y,
        cardWidth,
        cardHeight,
        cardOffsetLeft,
        cardOffsetTop
      };
      endline.byColumns[leastNumIndex] += height;
    });
    endline.start.x =
      cardWrapperWidth *
      endline.byColumns.indexOf(Math.min(...endline.byColumns));
    endline.start.y = Math.min(...endline.byColumns);
    endline.end.x =
      cardWrapperWidth *
      endline.byColumns.indexOf(Math.max(...endline.byColumns));
    endline.end.y = Math.max(...endline.byColumns);
    setLayout({
      elements: elements, // list of all elements with coorditares
      width: cardWrapperWidth * columns, // width of the whole layout
      height: endline.end.y, // height of the whole layout
      endline: endline
    });
  }, [columns, onLoadCount, onErrorCount, props.children, items]);

  const errorHandler = index => {
    setOnErrorCount(onErrorCount + 1);
    console.log("can't load: ", index);
  };

  const loadHandler = index => {
    setOnLoadCount(onLoadCount + 1);
  };

  renderChildren = React.Children.map(props.children, (child, index) => {
    // Change eash child
    let cloneChild = React.cloneElement(child, {
      draggableItem: {
        draggable: "true",
        onDragStart: e => onDragStart(e, items[index]),
        onDragOver: e => onDragOverItem(e, items[index]),
        onDragEnd: e => onDragEnd(e, items[index]),
        onTouchStart: onTouchStart,
        onTouchMove: onTouchMove,
        onTouchEnd: onTouchEnd
      }
    });
    let newComponent = (
      <div
        className="element-bounding"
        id={`${child.key}-wrapper`}
        style={{
          position: "absolute",
          margin: 0,
          padding: 0,
          touchAction: "none",
          top: `${layout.elements[index] ? layout.elements[index].y : 0}px`,
          left: `${layout.elements[index] ? layout.elements[index].x : 0}px`,
          transition: `${transition ? "top 0.4s, left 0.4s" : "none"}`,
          visibility: transition ? "visible" : "hidden",
          opacity: dragItem === items[index] ? 0 : 1
        }}
        onLoad={loadHandler}
        onError={errorHandler}
        onTransitionEnd={e => setIsRearranges(false)}
      >
        {cloneChild}
      </div>
    );
    return newComponent;
  });
  return (
    <div className="masonry" ref={masonryLayout}>
      <div
        style={{
          position: "relative",
          width: `${layout.width}px`,
          height: `${layout.height}px`,
          margin: "0 auto 0 auto"
        }}
        className="boundry-box"
      >
        {renderChildren}
        {ghost && ghost}
        {layout.endline.start.y !== undefined && (
          <React.Fragment>
            <div
              id="MasonryLayoutEndlineStart"
              ref={endlineStartRef}
              style={{
                position: "absolute",
                top: `${layout.endline.start.y}px`,
                left: `${layout.endline.start.x}px`
              }}
            />
            <div
              id="MasonryLayoutEndlineEnd"
              ref={endlineEndRef}
              style={{
                position: "absolute",
                top: `${layout.endline.end.y}px`,
                left: `${layout.endline.end.x}px`
              }}
            />
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

DraggableMasonryLayout.propTypes = {
  onEndlineEnter: PropTypes.func
};

export default DraggableMasonryLayout;
