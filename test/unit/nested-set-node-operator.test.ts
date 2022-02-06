import {CategoryFake} from "../mock/category.fake";
import {NestedSetNodeOperator} from "../../src/operator/index";
import {MikroORM} from "@mikro-orm/core";

it('should calculate left and right for 1-depth tree', async () => {

    await MikroORM.init({
        entities: [CategoryFake],
        type: 'mysql',
        dbName: 'dummy'
    }, false)

    const nestedSetNodeOperator = new NestedSetNodeOperator<CategoryFake>()

    const rootCategoryFake = new CategoryFake()
    rootCategoryFake.name = 'Root'

    const manCategoryFake = new CategoryFake()
    manCategoryFake.name = 'Man'

    const womanCategoryFake = new CategoryFake()
    womanCategoryFake.name = 'Woman'

    nestedSetNodeOperator.addNode(manCategoryFake, rootCategoryFake, rootCategoryFake)
    nestedSetNodeOperator.addNode(womanCategoryFake, rootCategoryFake, rootCategoryFake)

    nestedSetNodeOperator.recomputeTree(rootCategoryFake)

    expect(rootCategoryFake.left).toBe(1)
    expect(rootCategoryFake.right).toBe(6)

    expect(manCategoryFake.left).toBe(2)
    expect(manCategoryFake.right).toBe(3)

    expect(womanCategoryFake.left).toBe(4)
    expect(womanCategoryFake.right).toBe(5)

})

it('should calculate left and right for 2-depth tree', async () => {

    await MikroORM.init({
        entities: [CategoryFake],
        type: 'mysql',
        dbName: 'dummy'
    }, false)

    const nestedSetNodeOperator = new NestedSetNodeOperator<CategoryFake>()

    const rootCategoryFake = new CategoryFake()
    rootCategoryFake.name = 'Root'

    const manCategoryFake = new CategoryFake()
    manCategoryFake.name = 'Man'

    const womanCategoryFake = new CategoryFake()
    womanCategoryFake.name = 'Woman'


    const manShoesCategory = new CategoryFake()
    manCategoryFake.name = 'Man shoes'

    const manShirts = new CategoryFake()
    manCategoryFake.name = 'Man shirts'

    const womanShoes = new CategoryFake()
    womanShoes.name = 'Woman shoes'

    nestedSetNodeOperator.addNode(manCategoryFake, rootCategoryFake, rootCategoryFake)
    nestedSetNodeOperator.addNode(womanCategoryFake, rootCategoryFake, rootCategoryFake)
    nestedSetNodeOperator.addNode(manShoesCategory, manCategoryFake, rootCategoryFake)
    nestedSetNodeOperator.addNode(manShirts, manCategoryFake, rootCategoryFake)
    nestedSetNodeOperator.addNode(womanShoes, womanCategoryFake, rootCategoryFake)

    nestedSetNodeOperator.recomputeTree(rootCategoryFake)

    expect(rootCategoryFake.left).toBe(1)
    expect(rootCategoryFake.right).toBe(12)

    expect(manCategoryFake.left).toBe(2)
    expect(manCategoryFake.right).toBe(7)

    expect(womanCategoryFake.left).toBe(8)
    expect(womanCategoryFake.right).toBe(11)

    expect(manShoesCategory.left).toBe(3)
    expect(manShoesCategory.right).toBe(4)

    expect(manShirts.left).toBe(5)
    expect(manShirts.right).toBe(6)

    expect(womanShoes.left).toBe(9)
    expect(womanShoes.right).toBe(10)

})

it('should calculate left and right for 5-depth tree', () => {

})