1. Validate expected configuration by checking that no components are used that don't belong to the same module as at least one of the used systems.
2. State management: context vs Zustand vs persistent-state?
3. Cleanup the code, split into more helper functions (especially builderPage).
4. Validate test by checking that initial and expected have entities with same name and components
5. Make sure nested components work, including arrays
6. Add supports for different comparison operators <, >, !=

Check unused dependencies and dev vs prod

Add supports for different comparison operators <, >, !=

<, > defined only for numbers.
Or can we get info from Flecs whether <, > operators are defined for a particular component?

==, != is easy, just compared serialized entities or serialized components.

================================================================

Got serialized array of entitied from Client
Deser into vector of entities

Call all the systems

For each entity:
If no components of entity need <, > comparison:
Serialize entity to JSON
Compare serialized == or !=
if failed:
goto FAIL (entities do not match)
else:
if last entity:
goto SUCCESS
else:
Deser expected entity from JSON
For each _component_ that needs <, > comparison:
If (
_component_ ITSELF needs comparison

      ):
        if (
          is operator defined for _component_ // TODO: can we get that info on Client side?
        ):
          Compare components < or >
          if failed:
            goto FAIL (components do not match)
          else:
            if last entity and last _component_:
              goto SUCCESS
        else:
          goto FAIL (operator not defined for _component_)
      else: // One of the fields needs comparison
        for each field that needs comparison:
          if (
            is operator defined for field
          ):
            Compare fields < or >
              if failed:
                goto FAIL (fields do not match)
              else:
                if last entity and last _component_ and last field:
                  goto SUCCESS
            else:
              goto FAIL (operator not defined for field)

FAIL:
signalize test fail to client
goto END:

PASS:
signalize test pass to client

END:
halt

================================================================
