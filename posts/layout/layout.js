let placingElement = null;
let draggingElement = null;
let offsetX, offsetY;
let isDragging = false;
let rayStartElement = null;
let rayEndElement = null;

function startPlacingElement(type) {
    if (placingElement) {
        placingElement.remove();
    }

    placingElement = document.createElement('div');
    placingElement.className = `optical-element ${type}`;
    document.body.appendChild(placingElement);

    document.addEventListener('mousemove', moveElementWithCursor);
    document.addEventListener('click', placeElement);
}

function moveElementWithCursor(event) {
    if (placingElement) {
        placingElement.style.left = `${event.pageX - 20}px`;
        placingElement.style.top = `${event.pageY - 40}px`;
    }
}

function placeElement(event) {
    if (placingElement) {
        const container = document.getElementById('lens-diagram-container');
        if (event.pageY > container.offsetTop) {
            placingElement.style.left = `${snapToGrid(event.pageX - container.offsetLeft - 20)}px`;
            placingElement.style.top = `${snapToGrid(event.pageY - container.offsetTop - 40)}px`;
            container.appendChild(placingElement);
            makeDraggable(placingElement);

            placingElement = null;
            document.removeEventListener('mousemove', moveElementWithCursor);
            document.removeEventListener('click', placeElement);
        } else {
            console.log('Element placed outside the container, not emitting beam.');
        }
    } else {
        console.log('No placingElement found.');
    }
}

function snapToGrid(value) {
    const gridSize = 20;
    return Math.round(value / gridSize) * gridSize;
}

function makeDraggable(element) {
    element.addEventListener('mousedown', (event) => {
        draggingElement = element;
        offsetX = event.offsetX;
        offsetY = event.offsetY;
        isDragging = true;
        selectedElement = element;
        document.addEventListener('mousemove', dragElement);
        document.addEventListener('keydown', transformOnDrag);
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            draggingElement = null;
            isDragging = false;
            selectedElement = null;
            document.removeEventListener('mousemove', dragElement);
            document.removeEventListener('keydown', transformOnDrag);
        }
    });
}

function dragElement(event) {
    if (draggingElement && isDragging) {
        draggingElement.style.left = `${snapToGrid(event.pageX - offsetX - draggingElement.parentElement.offsetLeft)}px`;
        draggingElement.style.top = `${snapToGrid(event.pageY - offsetY - draggingElement.parentElement.offsetTop)}px`;
    }
}

function transformOnDrag(event) {
    if (selectedElement && isDragging) {
        if (event.key === 'ArrowLeft') {
            rotateElement(selectedElement, -45);
        } else if (event.key === 'ArrowRight') {
            rotateElement(selectedElement, 45);
        } else if (event.key === 'ArrowUp') {
            scaleElement(selectedElement, 1.1);
        } else if (event.key === 'ArrowDown') {
            scaleElement(selectedElement, 0.9);
        }
    }
}

function makeDeletable(element) {
    element.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        element.remove();
    });
}

function rotateElement(element, angle) {
    const currentRotation = parseInt(element.getAttribute('data-rotation') || '0');
    const newRotation = (currentRotation + angle) % 360;
    element.style.transform = `rotate(${newRotation}deg) scale(${element.getAttribute('data-scale') || 1})`;
    element.setAttribute('data-rotation', newRotation);
}

function scaleElement(element, scaleFactor) {
    const currentScale = parseFloat(element.getAttribute('data-scale') || '1');
    const newScale = currentScale * scaleFactor;
    element.style.transform = `scale(${newScale}) rotate(${element.getAttribute('data-rotation') || 0}deg)`;
    element.setAttribute('data-scale', newScale);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Document is ready');

    // Adding event listener to the container for testing purpose
    const container = document.getElementById('lens-diagram-container');
    container.addEventListener('click', (event) => {
        console.log('Container clicked');
    });
});

document.addEventListener('DOMNodeInserted', (event) => {
    if (event.target.classList.contains('optical-element')) {
        makeDraggable(event.target);
        makeDeletable(event.target);
    } else if (event.target.classList.contains('optical-ray')) {
        makeDraggable(event.target);
        makeDeletable(event.target);
    }
});

function addElement(type) {
    const container = document.getElementById('lens-diagram-container');
    const element = document.createElement('div');
    element.className = `optical-element ${type}`;
    element.style.left = `${snapToGrid(Math.random() * (container.clientWidth - 40))}px`;
    element.style.top = `${snapToGrid(Math.random() * (container.clientHeight - 80))}px`;
    container.appendChild(element);
    makeDraggable(element);
}

function addWindow() {
    addElement("clear window")
}

function addFlatMirror() {
    addElement("reflective flat-mirror")
}

function addStop() {
    addElement("opaque stop")
}

function addConcaveLens() {
    addElement('clear concave-lens');
}

function addConvexLens() {
    addElement('clear convex-lens');
}

function addConcaveMirror() {
    addElement('reflective concave-mirror');
}

function addConvexMirror() {
    addElement('reflective convex-mirror');
}

function addRay() {
    document.addEventListener('click', handleRayClick);
}

function handleRayClick(event) {
    const target = event.target;

    if (target.classList.contains('optical-element')) {
        if (!rayStartElement) {
            rayStartElement = target;
        } else if (!rayEndElement) {
            rayEndElement = target;

            drawRay(rayStartElement, rayEndElement);

            rayStartElement = null;
            rayEndElement = null;
            document.removeEventListener('click', handleRayClick);
        }
    }
}

function drawRay(startElement, endElement) {
    const container = document.getElementById('lens-diagram-container');
    const startRect = startElement.getBoundingClientRect();
    const endRect = endElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2 - containerRect.left;
    const startY = startRect.top + startRect.height / 2 - containerRect.top;
    const endX = endRect.left + endRect.width / 2 - containerRect.left;
    const endY = endRect.top + endRect.height / 2 - containerRect.top;

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const ray = document.createElement('div');
    ray.className = 'ray';
    ray.style.position = 'absolute';
    ray.style.left = `${startX}px`;
    ray.style.top = `${startY}px`;
    ray.style.width = `${length}px`;
    ray.style.height = `2px`; // Thickness of the ray
    ray.style.backgroundColor = 'yellow';
    ray.style.transformOrigin = '0 50%';
    ray.style.transform = `rotate(${angle}deg)`;
    ray.setAttribute('data-rotation', angle);
    ray.setAttribute('data-scale', 1);

    container.appendChild(ray);
    makeDraggable(ray);
    makeDeletable(ray);
}