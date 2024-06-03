let placingElement = null;
let draggingElement = null;
let offsetX, offsetY;
let isDragging = false;

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

function addConcaveLens() {
    addElement('concave-lens');
}

function addConvexLens() {
    addElement('convex-lens');
}

function addMirror() {
    addElement('mirror');
}

function addSource() {
    addElement('source');
}

function addDetector() {
    addElement('detector');
}
