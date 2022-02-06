import { NestedSetSubjectAbstract } from "../model";
import { randomUUID } from "crypto";
import { NodeNotFoundException } from "./exception";
import {CurrentLeftRightNode} from "../repository";

export class NestedSetNodeOperator<T extends NestedSetSubjectAbstract<T>> {

  addNode(nodeToAdd: T, parent: Partial<NestedSetSubjectAbstract<T>> & Pick<T, 'getIdentifier'>, writableTree: NestedSetSubjectAbstract<T>) {

    const node = this.findNodeInTree(writableTree, parent)

    if(!node) {
      throw new NodeNotFoundException(`Parent node not found`)
    }

    nodeToAdd.parent = node as T
    node.children.add(nodeToAdd as T)
  }

  removeNode(nodeToRemove: Partial<NestedSetSubjectAbstract<T>> & Pick<T, 'getIdentifier'>, writableTree: NestedSetSubjectAbstract<T>) {

    const node = this.findNodeInTree(writableTree, nodeToRemove)

    if(!node) {
      throw new NodeNotFoundException(`Parent node not found`)
    }

    if(node.parent) {
      node.parent.children.getItems().forEach(innerNode => {
        if(innerNode.getIdentifier() === node.getIdentifier()) {
          node.parent.children.remove(innerNode)
        }
      })
      node.parent = null
    }

    node.children.removeAll()
  }

  findNodeInTree(
    rootSubject : NestedSetSubjectAbstract<T>,
    nodeToFound: Partial<NestedSetSubjectAbstract<T>> & Pick<T, 'getIdentifier'>
  ) : NestedSetSubjectAbstract<T> | null {

    const computeSessionToken = randomUUID()
    let currentSubject = rootSubject

    while (true) {

      if(!nodeToFound.getIdentifier() && (currentSubject === nodeToFound)) {
        return currentSubject;
      }

      if(nodeToFound.getIdentifier() && (currentSubject.getIdentifier() === nodeToFound.getIdentifier())) {
        return currentSubject;
      }


      if (!currentSubject.hasAnyChildLeft(computeSessionToken) && !currentSubject.parent) {
        break;
      }

      if (currentSubject.children.length === 0) {
        currentSubject = currentSubject.parent as unknown as NestedSetSubjectAbstract<T>
        continue;
      }

      if (currentSubject.children.length >= 1) {


        // If it doesn't have any children then calculate right and return to parent
        if (!currentSubject.hasAnyChildLeft(computeSessionToken)) {
          currentSubject = currentSubject.parent as unknown as NestedSetSubjectAbstract<T>
          continue;
        }

        // Select next child from the pool
        currentSubject = currentSubject.getNextChild(computeSessionToken)
      }
    }

    return null

  }

  recomputeTree<T>(rootSubject: NestedSetSubjectAbstract<T>) : void {

    const currentLeftRightNode = new CurrentLeftRightNode()
    const rootEntity = rootSubject
    let currentEntity = rootSubject

    const computeSessionToken = randomUUID()
    rootEntity.left = currentLeftRightNode.getNextLeft()
    rootEntity.recalculatedLeft = true
    rootEntity.depth = 0

    while (true) {

      if(currentEntity.parent) {
        currentEntity.depth = currentEntity.parent.depth + 1
      }

      // If child has 0 children then calculate right and back to parent
      if (currentEntity.children.length === 0) {

        if (!currentEntity.recalculatedRight) {
          currentEntity.right = currentLeftRightNode.getNextRight()
          currentEntity.recalculatedRight = true
        }

        currentEntity = currentEntity.parent as unknown as NestedSetSubjectAbstract<T>
        continue;
      }

      if (currentEntity.children.length >= 1) {

        // If root then assign final right and break the loop
        if (!currentEntity.hasAnyChildLeft(computeSessionToken) && !currentEntity.parent) {
          currentEntity.right = currentLeftRightNode.getNextRight()
          currentEntity.recalculatedRight = true
          break;
        }

        // If it doesn't have any children then calculate right and return to parent
        if (!currentEntity.hasAnyChildLeft(computeSessionToken)) {

          if (!currentEntity.recalculatedRight) {
            currentEntity.right = currentLeftRightNode.getNextRight()
            currentEntity.recalculatedRight = true
          }

          currentEntity = currentEntity.parent as unknown as NestedSetSubjectAbstract<T>
          continue;
        }

        // Select next child from the pool
        currentEntity = currentEntity.getNextChild(computeSessionToken)

        // Calculate left for this child if necessary
        if (!currentEntity.recalculatedLeft) {
          currentEntity.left = currentLeftRightNode.getNextLeft()
          currentEntity.recalculatedLeft = true
        }
      }
    }
  }

}